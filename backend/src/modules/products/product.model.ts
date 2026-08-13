import { Schema, model, Document, Types } from 'mongoose';
import slugify from 'slugify';

export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface INutrition {
  servingSize?: string;
  calories?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  protein?: number;
  salt?: number;
  fiber?: number;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  description: string;
  shortDescription?: string;
  brand?: Types.ObjectId;
  category: Types.ObjectId;
  price: number;
  compareAtPrice?: number;
  discountPercentage: number;
  currency: string;
  unit: string;
  weight?: number;
  images: IProductImage[];
  thumbnail?: string;
  stock: number;
  lowStockThreshold: number;
  tags: string[];
  nutrition?: INutrition;
  rating: number;
  reviewCount: number;
  soldCount: number;
  viewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isOnDeal: boolean;
  isFlashSale: boolean;
  flashSaleEndsAt?: Date;
  meta: { title?: string; description?: string; keywords?: string[] };
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  finalPrice: number;
  inStock: boolean;
}

const imageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, index: true },
    barcode: { type: String, index: true, sparse: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 300 },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    price: { type: Number, required: true, min: 0, index: true },
    compareAtPrice: { type: Number, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    currency: { type: String, default: 'USD' },
    unit: { type: String, default: 'piece' },
    weight: { type: Number, min: 0 },
    images: { type: [imageSchema], default: [] },
    thumbnail: { type: String },
    stock: { type: Number, default: 0, min: 0, index: true },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    tags: { type: [String], default: [], index: true },
    nutrition: {
      servingSize: String,
      calories: Number,
      fat: Number,
      saturatedFat: Number,
      carbohydrates: Number,
      sugars: Number,
      protein: Number,
      salt: Number,
      fiber: Number,
    },
    rating: { type: Number, default: 0, min: 0, max: 5, index: true },
    reviewCount: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0, index: true },
    viewCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isOnDeal: { type: Boolean, default: false, index: true },
    isFlashSale: { type: Boolean, default: false, index: true },
    flashSaleEndsAt: { type: Date },
    meta: {
      title: String,
      description: String,
      keywords: [String],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

productSchema.virtual('finalPrice').get(function (this: IProduct): number {
  const discounted = this.price * (1 - (this.discountPercentage || 0) / 100);
  return Math.round(discounted * 100) / 100;
});

productSchema.virtual('inStock').get(function (this: IProduct): boolean {
  return this.stock > 0;
});

productSchema.pre('validate', function generateSlug(next) {
  if (this.isModified('name')) {
    const base = slugify(this.name, { lower: true, strict: true });
    if (!this.slug) this.slug = `${base}-${Date.now().toString(36)}`;
  }
  next();
});

// Compound indexes for common storefront queries.
productSchema.index({ category: 1, isActive: 1, price: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ soldCount: -1 });

export const Product = model<IProduct>('Product', productSchema);
