import { FilterQuery, Types } from 'mongoose';
import slugify from 'slugify';
import { IProduct, Product } from './product.model';
import { Category } from '../categories/category.model';
import { NotFoundError } from '../../common/errors/AppError';
import { escapeRegex, QueryOptions } from '../../common/utils/pagination';
import { CreateProductDto, UpdateProductDto } from './product.validation';

export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  tags?: string;
  inStock?: 'true' | 'false';
  onDeal?: 'true' | 'false';
  featured?: 'true' | 'false';
}

export interface PaginatedProducts {
  items: IProduct[];
  total: number;
}

export class ProductService {
  /** Builds a Mongo filter from storefront query params (supports slug or id). */
  private async buildFilter(options: QueryOptions, filters: ProductFilters): Promise<FilterQuery<IProduct>> {
    const filter: FilterQuery<IProduct> = { isActive: true };

    if (options.search) {
      const rx = new RegExp(escapeRegex(options.search), 'i');
      filter.$or = [{ name: rx }, { description: rx }, { tags: rx }, { sku: rx }];
    }

    if (filters.category) {
      const categoryId = await this.resolveCategoryId(filters.category);
      if (categoryId) filter.category = categoryId;
    }
    if (filters.brand && Types.ObjectId.isValid(filters.brand)) {
      filter.brand = new Types.ObjectId(filters.brand);
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const price: { $gte?: number; $lte?: number } = {};
      if (filters.minPrice !== undefined) price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) price.$lte = filters.maxPrice;
      filter.price = price;
    }
    if (filters.minRating !== undefined) filter.rating = { $gte: filters.minRating };
    if (filters.tags) filter.tags = { $in: filters.tags.split(',').map((t) => t.trim()) };
    if (filters.inStock === 'true') filter.stock = { $gt: 0 };
    if (filters.onDeal === 'true') filter.isOnDeal = true;
    if (filters.featured === 'true') filter.isFeatured = true;

    return filter;
  }

  private async resolveCategoryId(value: string): Promise<Types.ObjectId | null> {
    if (Types.ObjectId.isValid(value)) return new Types.ObjectId(value);
    const cat = await Category.findOne({ slug: value }).select('_id').lean();
    return cat?._id ?? null;
  }

  async list(options: QueryOptions, filters: ProductFilters): Promise<PaginatedProducts> {
    const filter = await this.buildFilter(options, filters);
    const [items, total] = await Promise.all([
      Product.find(filter)
        .populate('brand', 'name slug logo')
        .populate('category', 'name slug')
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit)
        .lean<IProduct[]>(),
      Product.countDocuments(filter),
    ]);
    return { items, total };
  }

  async findByIdOrSlug(idOrSlug: string, incrementView = false): Promise<IProduct> {
    const query: FilterQuery<IProduct> = Types.ObjectId.isValid(idOrSlug)
      ? { _id: idOrSlug }
      : { slug: idOrSlug };
    const product = await Product.findOne(query)
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug');
    if (!product) throw new NotFoundError('Product not found');

    if (incrementView) {
      await Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } });
    }
    return product;
  }

  async create(dto: CreateProductDto, userId?: string): Promise<IProduct> {
    const sku = dto.sku ?? this.generateSku(dto.name);
    const slug = `${slugify(dto.name, { lower: true, strict: true })}-${Date.now().toString(36)}`;
    return Product.create({
      ...dto,
      sku,
      slug,
      thumbnail: dto.thumbnail ?? dto.images?.find((i) => i.isPrimary)?.url ?? dto.images?.[0]?.url,
      ...(userId ? { createdBy: new Types.ObjectId(userId) } : {}),
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<IProduct> {
    const product = await Product.findByIdAndUpdate(id, dto, { new: true, runValidators: true });
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  async remove(id: string): Promise<void> {
    const res = await Product.findByIdAndUpdate(id, { isActive: false });
    if (!res) throw new NotFoundError('Product not found');
  }

  async featured(limit = 12): Promise<IProduct[]> {
    return Product.find({ isActive: true, isFeatured: true })
      .sort('-createdAt')
      .limit(limit)
      .lean<IProduct[]>();
  }

  async bestSellers(limit = 12): Promise<IProduct[]> {
    return Product.find({ isActive: true })
      .sort('-soldCount')
      .limit(limit)
      .lean<IProduct[]>();
  }

  async deals(limit = 12): Promise<IProduct[]> {
    return Product.find({ isActive: true, isOnDeal: true, discountPercentage: { $gt: 0 } })
      .sort('-discountPercentage')
      .limit(limit)
      .lean<IProduct[]>();
  }

  async flashSales(limit = 12): Promise<IProduct[]> {
    return Product.find({
      isActive: true,
      isFlashSale: true,
      flashSaleEndsAt: { $gt: new Date() },
    })
      .sort('flashSaleEndsAt')
      .limit(limit)
      .lean<IProduct[]>();
  }

  /** Related products by shared category, excluding the source product. */
  async related(idOrSlug: string, limit = 8): Promise<IProduct[]> {
    const product = await this.findByIdOrSlug(idOrSlug);
    return Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true,
    })
      .sort('-soldCount')
      .limit(limit)
      .lean<IProduct[]>();
  }

  private generateSku(name: string): string {
    const prefix = slugify(name, { lower: false, strict: true }).slice(0, 6).toUpperCase() || 'PROD';
    return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  }
}

export const productService = new ProductService();
