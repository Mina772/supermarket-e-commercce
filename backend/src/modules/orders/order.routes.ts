import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { buildPaginationMeta, created, ok } from '../../common/utils/apiResponse';
import { parseQueryOptions } from '../../common/utils/pagination';
import { STAFF_ROLES } from '../../common/constants/roles';
import { orderService } from './order.service';
import { ORDER_STATUS, PAYMENT_METHOD } from './order.model';

const router = Router();
router.use(authenticate);

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().optional(),
  postalCode: z.string().min(3),
  country: z.string().min(2),
});

const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  paymentMethod: z.enum([
    PAYMENT_METHOD.CASH,
    PAYMENT_METHOD.COD,
    PAYMENT_METHOD.STRIPE,
    PAYMENT_METHOD.PAYPAL,
  ]),
  notes: z.string().max(500).optional(),
});

const statusSchema = z.object({
  status: z.enum([
    ORDER_STATUS.PAID,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPING,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED,
  ]),
  note: z.string().max(300).optional(),
});

// --- Customer ---
router.post(
  '/checkout',
  validate({ body: checkoutSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    created(res, await orderService.checkout(req.user!.id, req.body), 'Order placed'),
  ),
);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const options = parseQueryOptions(req);
    const { items, total } = await orderService.listForUser(req.user!.id, options);
    return ok(res, items, 'Your orders', 200, buildPaginationMeta(options.page, options.limit, total));
  }),
);

// --- Staff (must precede /:id) ---
router.get(
  '/admin/all',
  authorize(...STAFF_ROLES),
  asyncHandler(async (req: Request, res: Response) => {
    const options = parseQueryOptions(req);
    const status = req.query.status ? String(req.query.status) : undefined;
    const { items, total } = await orderService.listAll(options, status);
    return ok(res, items, 'All orders', 200, buildPaginationMeta(options.page, options.limit, total));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const isStaff = STAFF_ROLES.includes(req.user!.role);
    return ok(res, await orderService.getById(req.params.id, req.user!.id, isStaff), 'Order');
  }),
);

router.post(
  '/:id/cancel',
  asyncHandler(async (req: Request, res: Response) => ok(res, await orderService.cancelOwn(req.params.id, req.user!.id), 'Order cancelled')),
);

router.patch(
  '/:id/status',
  authorize(...STAFF_ROLES),
  validate({ body: statusSchema }),
  asyncHandler(async (req: Request, res: Response) =>
    ok(res, await orderService.updateStatus(req.params.id, req.body.status, req.user!.id, req.body.note), 'Status updated'),
  ),
);

export const orderRoutes = router;
