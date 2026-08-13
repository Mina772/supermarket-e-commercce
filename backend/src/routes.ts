import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/user.routes';
import { productRoutes } from './modules/products/product.routes';
import { categoryRoutes } from './modules/categories/category.routes';
import { brandRoutes } from './modules/brands/brand.routes';
import { cartRoutes } from './modules/cart/cart.routes';
import { orderRoutes } from './modules/orders/order.routes';
import { reviewRoutes } from './modules/reviews/review.routes';
import { couponRoutes } from './modules/coupons/coupon.routes';
import { addressRoutes } from './modules/addresses/address.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { uploadRoutes } from './modules/uploads/upload.routes';
import { healthRoutes } from './modules/health/health.routes';

/** Aggregates every feature router under the versioned API prefix. */
export const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/brands', brandRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/coupons', couponRoutes);
apiRouter.use('/addresses', addressRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/uploads', uploadRoutes);
