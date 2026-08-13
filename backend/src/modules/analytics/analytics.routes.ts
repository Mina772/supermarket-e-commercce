import { Router, Request, Response } from 'express';
import { Order, ORDER_STATUS } from '../orders/order.model';
import { Product } from '../products/product.model';
import { User } from '../users/user.model';
import { Review, REVIEW_STATUS } from '../reviews/review.model';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ok } from '../../common/utils/apiResponse';
import { STAFF_ROLES } from '../../common/constants/roles';

const router = Router();
router.use(authenticate, authorize(...STAFF_ROLES));

const REVENUE_STATUSES = [
  ORDER_STATUS.PAID,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPING,
  ORDER_STATUS.DELIVERED,
];

router.get(
  '/dashboard',
  asyncHandler(async (_req: Request, res: Response) => {
    const [
      revenueAgg,
      totalOrders,
      pendingOrders,
      totalProducts,
      lowStock,
      totalCustomers,
      pendingReviews,
    ] = await Promise.all([
      Order.aggregate<{ _id: null; revenue: number; count: number }>([
        { $match: { status: { $in: REVENUE_STATUSES } } },
        { $group: { _id: null, revenue: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ status: ORDER_STATUS.PENDING }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
      User.countDocuments({ role: 'customer' }),
      Review.countDocuments({ status: REVIEW_STATUS.PENDING }),
    ]);

    return ok(res, {
      revenue: revenueAgg[0]?.revenue ?? 0,
      paidOrders: revenueAgg[0]?.count ?? 0,
      totalOrders,
      pendingOrders,
      totalProducts,
      lowStock,
      totalCustomers,
      pendingReviews,
      averageOrderValue: revenueAgg[0]?.count ? (revenueAgg[0].revenue / revenueAgg[0].count) : 0,
    }, 'Dashboard metrics');
  }),
);

router.get(
  '/sales',
  asyncHandler(async (req: Request, res: Response) => {
    const days = Math.min(365, Number(req.query.days) || 30);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const series = await Order.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES }, createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1, orders: 1 } },
    ]);
    return ok(res, series, 'Sales over time');
  }),
);

router.get(
  '/top-products',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const items = await Product.find({ isActive: true })
      .sort('-soldCount')
      .limit(limit)
      .select('name thumbnail soldCount price rating stock')
      .lean();
    return ok(res, items, 'Top products');
  }),
);

router.get(
  '/orders-by-status',
  asyncHandler(async (_req: Request, res: Response) => {
    const grouped = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]);
    return ok(res, grouped, 'Orders by status');
  }),
);

export const analyticsRoutes = router;
