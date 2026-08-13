import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  sku: z.string().min(2).max(60).optional(),
  barcode: z.string().max(60).optional(),
  description: z.string().min(10),
  shortDescription: z.string().max(300).optional(),
  brand: objectId.optional(),
  category: objectId,
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).optional(),
  unit: z.string().optional(),
  weight: z.number().nonnegative().optional(),
  images: z
    .array(z.object({ url: z.string().url(), alt: z.string().optional(), isPrimary: z.boolean().optional() }))
    .optional(),
  thumbnail: z.string().url().optional(),
  stock: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  nutrition: z.record(z.union([z.string(), z.number()])).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isOnDeal: z.boolean().optional(),
  isFlashSale: z.boolean().optional(),
  flashSaleEndsAt: z.coerce.date().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  category: objectId.optional(),
});

export const listProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  tags: z.string().optional(),
  inStock: z.enum(['true', 'false']).optional(),
  onDeal: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
});

export const productParamsSchema = z.object({ id: z.string().min(1) });

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
