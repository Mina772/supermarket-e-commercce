import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { InventoryLog, INVENTORY_REASON, InventoryReason } from './inventory.model';
import { Product } from '../products/product.model';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { buildPaginationMeta, ok } from '../../common/utils/apiResponse';
import { parseQueryOptions } from '../../common/utils/pagination';
import { STAFF_ROLES } from '../../common/constants/roles';
import { NotFoundError } from '../../common/errors/AppError';

const router = Router();
router.use(authenticate, authorize(...STAFF_ROLES));

const adjustSchema = z.object({
  change: z.number().int(),
  reason: z.enum([
    INVENTORY_REASON.PURCHASE,
    INVENTORY_REASON.RESTOCK,
    INVENTORY_REASON.ADJUSTMENT,
    INVENTORY_REASON.DAMAGE,
    INVENTORY_REASON.RETURN,
  ]),
  reference: z.string().optional(),
});

// Low-stock report
router.get(
  '/low-stock',
  asyncHandler(async (_req: Request, res: Response) => {
    const items = await Product.find({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
      .select('name sku stock lowStockThreshold thumbnail price')
      .sort('stock')
      .lean();
    return ok(res, items, 'Low stock products');
  }),
);

// Out-of-stock report
router.get(
  '/out-of-stock',
  asyncHandler(async (_req: Request, res: Response) => {
    const items = await Product.find({ isActive: true, stock: 0 }).select('name sku stock thumbnail price').lean();
    return ok(res, items, 'Out of stock products');
  }),
);

// Inventory history for a product
router.get(
  '/history/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    const options = parseQueryOptions(req);
    const filter = { product: new Types.ObjectId(req.params.productId) };
    const [items, total] = await Promise.all([
      InventoryLog.find(filter).populate('performedBy', 'firstName lastName').sort(options.sort).skip(options.skip).limit(options.limit).lean(),
      InventoryLog.countDocuments(filter),
    ]);
    return ok(res, items, 'Inventory history', 200, buildPaginationMeta(options.page, options.limit, total));
  }),
);

// Adjust stock (restock / damage / adjustment)
router.post(
  '/adjust/:productId',
  validate({ body: adjustSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { $inc: { stock: req.body.change } },
      { new: true },
    );
    if (!product) throw new NotFoundError('Product not found');
    if (product.stock < 0) {
      // never allow negative stock
      await Product.updateOne({ _id: product._id }, { stock: 0 });
      product.stock = 0;
    }
    await InventoryLog.create({
      product: product._id,
      change: req.body.change,
      balanceAfter: product.stock,
      reason: req.body.reason as InventoryReason,
      reference: req.body.reference,
      performedBy: new Types.ObjectId(req.user!.id),
    });
    return ok(res, product, 'Stock adjusted');
  }),
);

export const inventoryRoutes = router;
