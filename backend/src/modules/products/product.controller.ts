import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { buildPaginationMeta, created, noContent, ok } from '../../common/utils/apiResponse';
import { parseQueryOptions } from '../../common/utils/pagination';
import { productService, ProductFilters } from './product.service';

export const productController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const options = parseQueryOptions(req);
    const filters = req.query as unknown as ProductFilters;
    const { items, total } = await productService.list(options, filters);
    return ok(res, items, 'Products fetched', 200, buildPaginationMeta(options.page, options.limit, total));
  }),

  detail: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.findByIdOrSlug(req.params.id, true);
    return ok(res, product, 'Product fetched');
  }),

  featured: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.featured(Number(req.query.limit) || 12);
    return ok(res, data, 'Featured products');
  }),

  bestSellers: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.bestSellers(Number(req.query.limit) || 12);
    return ok(res, data, 'Best sellers');
  }),

  deals: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.deals(Number(req.query.limit) || 12);
    return ok(res, data, 'Deals');
  }),

  flashSales: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.flashSales(Number(req.query.limit) || 12);
    return ok(res, data, 'Flash sales');
  }),

  related: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.related(req.params.id, Number(req.query.limit) || 8);
    return ok(res, data, 'Related products');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.create(req.body, req.user?.id);
    return created(res, product, 'Product created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.update(req.params.id, req.body);
    return ok(res, product, 'Product updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await productService.remove(req.params.id);
    return noContent(res);
  }),
};
