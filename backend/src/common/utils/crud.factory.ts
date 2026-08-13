import { Model, FilterQuery, Document } from 'mongoose';
import { NotFoundError } from '../errors/AppError';
import { QueryOptions, escapeRegex } from './pagination';

/**
 * Generic, reusable CRUD service for simple resources (categories, brands).
 * Keeps controllers thin and eliminates duplicated data-access logic (DRY).
 */
export class CrudService<T extends Document> {
  constructor(
    private readonly model: Model<T>,
    private readonly searchableFields: string[] = [],
    private readonly resourceName = 'Resource',
  ) {}

  async list(
    options: QueryOptions,
    baseFilter: FilterQuery<T> = {},
  ): Promise<{ items: T[]; total: number }> {
    const filter: FilterQuery<T> = { ...baseFilter };
    if (options.search && this.searchableFields.length) {
      const rx = new RegExp(escapeRegex(options.search), 'i');
      (filter as Record<string, unknown>).$or = this.searchableFields.map((f) => ({ [f]: rx }));
    }
    const [items, total] = await Promise.all([
      this.model.find(filter).sort(options.sort).skip(options.skip).limit(options.limit).lean<T[]>(),
      this.model.countDocuments(filter),
    ]);
    return { items, total };
  }

  async findByIdOrSlug(idOrSlug: string): Promise<T> {
    const isId = /^[a-f\d]{24}$/i.test(idOrSlug);
    const doc = await this.model.findOne(
      (isId ? { _id: idOrSlug } : { slug: idOrSlug }) as FilterQuery<T>,
    );
    if (!doc) throw new NotFoundError(`${this.resourceName} not found`);
    return doc;
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!doc) throw new NotFoundError(`${this.resourceName} not found`);
    return doc;
  }

  async remove(id: string): Promise<void> {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new NotFoundError(`${this.resourceName} not found`);
  }
}
