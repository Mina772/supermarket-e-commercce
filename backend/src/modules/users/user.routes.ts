import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { User } from './user.model';
import { Product } from '../products/product.model';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { buildPaginationMeta, ok } from '../../common/utils/apiResponse';
import { parseQueryOptions, escapeRegex } from '../../common/utils/pagination';
import { ROLES, ALL_ROLES } from '../../common/constants/roles';
import { NotFoundError } from '../../common/errors/AppError';

const router = Router();
router.use(authenticate);

/* ----------------------- Wishlist (customer) ----------------------- */
router.get(
  '/me/wishlist',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user!.id).populate({
      path: 'wishlist',
      select: 'name slug price finalPrice discountPercentage thumbnail rating stock',
    });
    return ok(res, user?.wishlist ?? [], 'Wishlist');
  }),
);

router.post(
  '/me/wishlist/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    const pid = new Types.ObjectId(req.params.productId);
    const exists = await Product.exists({ _id: pid });
    if (!exists) throw new NotFoundError('Product not found');
    await User.updateOne({ _id: req.user!.id }, { $addToSet: { wishlist: pid } });
    return ok(res, null, 'Added to wishlist');
  }),
);

router.delete(
  '/me/wishlist/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    await User.updateOne({ _id: req.user!.id }, { $pull: { wishlist: new Types.ObjectId(req.params.productId) } });
    return ok(res, null, 'Removed from wishlist');
  }),
);

/* ----------------------- Recently viewed (customer) ----------------------- */
router.get(
  '/me/recently-viewed',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user!.id).populate({
      path: 'recentlyViewed.product',
      select: 'name slug price finalPrice thumbnail rating',
    });
    return ok(res, user?.recentlyViewed ?? [], 'Recently viewed');
  }),
);

router.post(
  '/me/recently-viewed/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    const pid = new Types.ObjectId(req.params.productId);
    await User.updateOne({ _id: req.user!.id }, { $pull: { recentlyViewed: { product: pid } } });
    await User.updateOne(
      { _id: req.user!.id },
      { $push: { recentlyViewed: { $each: [{ product: pid, viewedAt: new Date() }], $position: 0, $slice: 20 } } },
    );
    return ok(res, null, 'Recorded');
  }),
);

/* ----------------------- Admin user management ----------------------- */
router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  asyncHandler(async (req: Request, res: Response) => {
    const options = parseQueryOptions(req);
    const filter: Record<string, unknown> = {};
    if (options.search) {
      const rx = new RegExp(escapeRegex(options.search), 'i');
      filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }];
    }
    if (req.query.role) filter.role = req.query.role;
    const [items, total] = await Promise.all([
      User.find(filter).sort(options.sort).skip(options.skip).limit(options.limit).lean(),
      User.countDocuments(filter),
    ]);
    return ok(res, items, 'Users', 200, buildPaginationMeta(options.page, options.limit, total));
  }),
);

router.patch(
  '/:id/role',
  authorize(ROLES.ADMIN),
  validate({ body: z.object({ role: z.enum([ALL_ROLES[0], ...ALL_ROLES.slice(1)]) }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role, $inc: { tokenVersion: 1 } }, { new: true });
    if (!user) throw new NotFoundError('User not found');
    return ok(res, user, 'Role updated');
  }),
);

router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN),
  validate({ body: z.object({ isActive: z.boolean() }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive, $inc: { tokenVersion: 1 } }, { new: true });
    if (!user) throw new NotFoundError('User not found');
    return ok(res, user, 'Status updated');
  }),
);

export const userRoutes = router;
