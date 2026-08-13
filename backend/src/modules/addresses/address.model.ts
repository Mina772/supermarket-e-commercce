import { Schema, model, Document, Types } from 'mongoose';

export interface IAddress extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, default: 'Home' },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'USA' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const Address = model<IAddress>('Address', addressSchema);
