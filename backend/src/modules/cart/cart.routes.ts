import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ok } from '../../common/utils/apiResponse';
import { cartService } from './cart.service';

const router = Router();
router.use(authenticate);

const addSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i),
  quantity: z.number().int().positive().max(999).default(1),
});
const updateSchema = z.object({ quantity: z.number().int().min(0).max(999) });
const couponSchema = z.object({ code: z.string().min(2).max(40) });

router.get('/', asyncHandler(async (req: Request, res: Response) => ok(res, await cartService.view(req.user!.id), 'Cart')));

router.post(
  '/items',
  validate({ body: addSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ok(res, await cartService.addItem(req.user!.id, req.body.productId, req.body.quantity), 'Item added'),
  ),
);

router.patch(
  '/items/:productId',
  validate({ body: updateSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ok(res, await cartService.updateItem(req.user!.id, req.params.productId, req.body.quantity), 'Item updated'),
  ),
);

router.delete(
  '/items/:productId',
  asyncHandler(async (req: Request, res: Response) =>
    ok(res, await cartService.removeItem(req.user!.id, req.params.productId), 'Item removed'),
  ),
);

router.delete('/', asyncHandler(async (req: Request, res: Response) => ok(res, await cartService.clear(req.user!.id), 'Cart cleared')));

router.post(
  '/coupon',
  validate({ body: couponSchema }),
  asyncHandler(async (req: Request, res: Response) => ok(res, await cartService.applyCoupon(req.user!.id, req.body.code), 'Coupon applied')),
);

router.delete('/coupon', asyncHandler(async (req: Request, res: Response) => ok(res, await cartService.removeCoupon(req.user!.id), 'Coupon removed')));

export const cartRoutes = router;
