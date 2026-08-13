import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { ROLES } from '../../common/constants/roles';
import { productController } from './product.controller';
import {
  createProductSchema,
  listProductQuerySchema,
  updateProductSchema,
} from './product.validation';

const router = Router();

// Public storefront endpoints
router.get('/', validate({ query: listProductQuerySchema }), productController.list);
router.get('/featured', productController.featured);
router.get('/best-sellers', productController.bestSellers);
router.get('/deals', productController.deals);
router.get('/flash-sales', productController.flashSales);
router.get('/:id/related', productController.related);
router.get('/:id', productController.detail);

// Staff-only management endpoints
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate({ body: createProductSchema }),
  productController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate({ body: updateProductSchema }),
  productController.update,
);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), productController.remove);

export const productRoutes = router;
