import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Coupon, DISCOUNT_TYPE } from './coupon.model';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { buildPaginationMeta, created, noContent, ok } from '../../common/utils/apiResponse';
import { parseQueryOptions } from '../../common/utils/pagination';
import { STAFF_ROLES } from '../../common/constants/roles';
import { BadRequestError, NotFoundError } from '../../common/errors/AppError';

const router = Router();

const createSchema = z.object({
  code: z.string().min(2).max(40),
  description: z.string().max(300).optional(),
  discountType: z.enum([DISCOUNT_TYPE.PERCENTAGE, DISCOUNT_TYPE.FIXED]),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

// Public: validate a coupon code (does not consume it)
router.get(
  '/validate/:code',
  asyncHandler(async (req: Request, res: Response) => {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase(), isActive: true }).lean();
    if (!coupon) throw new NotFoundError('Coupon not found or inactive');
    const now = new Date();
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) throw new BadRequestError('Coupon expired');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new BadRequestError('Coupon fully redeemed');
    return ok(res, coupon, 'Coupon is valid');
  }),
);

router.use(authenticate, authorize(...STAFF_ROLES));

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const options = parseQueryOptions(req);
    const [items, total] = await Promise.all([
      Coupon.find().sort(options.sort).skip(options.skip).limit(options.limit).lean(),
      Coupon.countDocuments(),
    ]);
    return ok(res, items, 'Coupons', 200, buildPaginationMeta(options.page, options.limit, total));
  }),
);

router.post(
  '/',
  validate({ body: createSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    created(res, await Coupon.create({ ...req.body, code: String(req.body.code).toUpperCase() }), 'Coupon created'),
  ),
);

router.patch(
  '/:id',
  validate({ body: createSchema.partial() }),
  asyncHandler(async (req: Request, res: Response) => {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) throw new NotFoundError('Coupon not found');
    return ok(res, coupon, 'Coupon updated');
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) throw new NotFoundError('Coupon not found');
    return noContent(res);
  }),
);

export const couponRoutes = router;
