import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Brand } from './brand.model';
import { Product } from '../products/product.model';
import { CrudService } from '../../common/utils/crud.factory';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { buildPaginationMeta, created, noContent, ok } from '../../common/utils/apiResponse';
import { parseQueryOptions } from '../../common/utils/pagination';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { ROLES } from '../../common/constants/roles';

const service = new CrudService(Brand, ['name', 'description'], 'Brand');

const createSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const router = Router();

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const options = parseQueryOptions(req, 'name');
    const base = req.query.featured === 'true' ? { isFeatured: true, isActive: true } : {};
    const { items, total } = await service.list(options, base);
    const withCounts = await Promise.all(
      items.map(async (b) => ({
        ...b,
        productCount: await Product.countDocuments({ brand: b._id, isActive: true }),
      })),
    );
    return ok(res, withCounts, 'Brands', 200, buildPaginationMeta(options.page, options.limit, total));
  }),
);

router.get(
  '/:idOrSlug',
  asyncHandler(async (req: Request, res: Response) => ok(res, await service.findByIdOrSlug(req.params.idOrSlug), 'Brand')),
);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate({ body: createSchema }),
  asyncHandler(async (req: Request, res: Response) => created(res, await service.create(req.body), 'Brand created')),
);

router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate({ body: createSchema.partial() }),
  asyncHandler(async (req: Request, res: Response) => ok(res, await service.update(req.params.id, req.body), 'Brand updated')),
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(async (req: Request, res: Response) => {
    await service.remove(req.params.id);
    return noContent(res);
  }),
);

export const brandRoutes = router;
