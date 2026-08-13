import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Review, REVIEW_STATUS } from './review.model';
import { Product } from '../products/product.model';
import { Order, ORDER_STATUS } from '../orders/order.model';
import { authenticate, optionalAuth } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { buildPaginationMeta, created, noContent, ok } from '../../common/utils/apiResponse';
import { parseQueryOptions } from '../../common/utils/pagination';
import { STAFF_ROLES } from '../../common/constants/roles';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors/AppError';

const router = Router();

const createSchema = z.object({
  product: z.string().regex(/^[a-f\d]{24}$/i),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(3).max(2000),
  images: z.array(z.string().url()).optional(),
});

/** Recomputes a product's average rating & review count from approved reviews. */
async function recomputeRating(productId: Types.ObjectId): Promise<void> {
  const stats = await Review.aggregate<{ _id: null; avg: number; count: number }>([
    { $match: { product: productId, status: REVIEW_STATUS.APPROVED } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = stats[0]?.avg ?? 0;
  const count = stats[0]?.count ?? 0;
  await Product.updateOne(
    { _id: productId },
    { rating: Math.round(avg * 10) / 10, reviewCount: count },
  );
}

// List approved reviews for a product (public)
router.get(
  '/product/:productId',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const options = parseQueryOptions(req);
    const filter = { product: new Types.ObjectId(req.params.productId), status: REVIEW_STATUS.APPROVED };
    const [items, total] = await Promise.all([
      Review.find(filter)
        .populate('user', 'firstName lastName avatar')
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      Review.countDocuments(filter),
    ]);
    return ok(res, items, 'Reviews', 200, buildPaginationMeta(options.page, options.limit, total));
  }),
);

// Create a review (authenticated); auto verified-purchase flag
router.post(
  '/',
  authenticate,
  validate({ body: createSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const productId = new Types.ObjectId(req.body.product as string);
    const product = await Product.findById(productId);
    if (!product) throw new NotFoundError('Product not found');

    const existing = await Review.findOne({ product: productId, user: req.user!.id });
    if (existing) throw new BadRequestError('You have already reviewed this product');

    const purchased = await Order.exists({
      user: req.user!.id,
      'items.product': productId,
      status: { $in: [ORDER_STATUS.DELIVERED, ORDER_STATUS.PAID] },
    });

    const review = await Review.create({
      ...req.body,
      user: req.user!.id,
      isVerifiedPurchase: Boolean(purchased),
      status: REVIEW_STATUS.PENDING,
    });
    return created(res, review, 'Review submitted for moderation');
  }),
);

// Moderate (staff)
router.patch(
  '/:id/moderate',
  authenticate,
  authorize(...STAFF_ROLES),
  validate({ body: z.object({ status: z.enum([REVIEW_STATUS.APPROVED, REVIEW_STATUS.REJECTED]) }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const review = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!review) throw new NotFoundError('Review not found');
    await recomputeRating(review.product);
    return ok(res, review, 'Review moderated');
  }),
);

// Delete own review or staff
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const review = await Review.findById(req.params.id);
    if (!review) throw new NotFoundError('Review not found');
    const isStaff = STAFF_ROLES.includes(req.user!.role);
    if (!isStaff && review.user.toString() !== req.user!.id) throw new ForbiddenError();
    await review.deleteOne();
    await recomputeRating(review.product);
    return noContent(res);
  }),
);

// Admin: list all (for moderation queue)
router.get(
  '/',
  authenticate,
  authorize(...STAFF_ROLES),
  asyncHandler(async (req: Request, res: Response) => {
    const options = parseQueryOptions(req);
    const filter = req.query.status ? { status: String(req.query.status) } : {};
    const [items, total] = await Promise.all([
      Review.find(filter).populate('user', 'firstName lastName email').populate('product', 'name slug thumbnail').sort(options.sort).skip(options.skip).limit(options.limit).lean(),
      Review.countDocuments(filter),
    ]);
    return ok(res, items, 'Reviews', 200, buildPaginationMeta(options.page, options.limit, total));
  }),
);

export const reviewRoutes = router;
