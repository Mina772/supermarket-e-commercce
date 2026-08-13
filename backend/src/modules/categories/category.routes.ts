import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Category } from './category.model';
import { Product } from '../products/product.model';
import { CrudService } from '../../common/utils/crud.factory';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { buildPaginationMeta, created, noContent, ok } from '../../common/utils/apiResponse';
import { parseQueryOptions } from '../../common/utils/pagination';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { ROLES } from '../../common/constants/roles';

const service = new CrudService(Category, ['name', 'description'], 'Category');

const createSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  icon: z.string().optional(),
  parent: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const router = Router();

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const options = parseQueryOptions(req, 'sortOrder');
    const base = req.query.featured === 'true' ? { isFeatured: true, isActive: true } : {};
    const { items, total } = await service.list(options, base);
    const withCounts = await Promise.all(
      items.map(async (c) => ({
        ...c,
        productCount: await Product.countDocuments({ category: c._id, isActive: true }),
      })),
    );
    return ok(res, withCounts, 'Categories', 200, buildPaginationMeta(options.page, options.limit, total));
  }),
);

router.get(
  '/:idOrSlug',
  asyncHandler(async (req: Request, res: Response) => {
    const category = await service.findByIdOrSlug(req.params.idOrSlug);
    return ok(res, category, 'Category');
  }),
);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate({ body: createSchema }),
  asyncHandler(async (req: Request, res: Response) => created(res, await service.create(req.body), 'Category created')),
);

router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate({ body: createSchema.partial() }),
  asyncHandler(async (req: Request, res: Response) => ok(res, await service.update(req.params.id, req.body), 'Category updated')),
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

export const categoryRoutes = router;
