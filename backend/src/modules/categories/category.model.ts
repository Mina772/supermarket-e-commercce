import { Schema, model, Document, Types } from 'mongoose';
import slugify from 'slugify';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parent?: Types.ObjectId | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, maxlength: 500 },
    image: { type: String },
    icon: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

categorySchema.pre('validate', function generateSlug(next) {
  if (this.isModified('name') && !this.isModified('slug')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export const Category = model<ICategory>('Category', categorySchema);
