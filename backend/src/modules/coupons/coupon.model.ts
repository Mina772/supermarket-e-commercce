import { Schema, model, Document, Types } from 'mongoose';

export const DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
} as const;
export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE];

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;
  startsAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  usedBy: { user: Types.ObjectId; count: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, maxlength: 300 },
    discountType: { type: String, enum: Object.values(DISCOUNT_TYPE), required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    usageLimit: { type: Number, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    startsAt: { type: Date },
    expiresAt: { type: Date, index: true },
    isActive: { type: Boolean, default: true, index: true },
    usedBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const Coupon = model<ICoupon>('Coupon', couponSchema);
