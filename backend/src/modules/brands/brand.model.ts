import { Schema, model, Document, Types } from 'mongoose';
import slugify from 'slugify';

export interface IBrand extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, maxlength: 500 },
    logo: { type: String },
    website: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

brandSchema.pre('validate', function generateSlug(next) {
  if (this.isModified('name') && !this.isModified('slug')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export const Brand = model<IBrand>('Brand', brandSchema);
