import { Schema, model, Document, Types } from 'mongoose';

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const PAYMENT_METHOD = {
  CASH: 'cash',
  COD: 'cod',
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
} as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  sku: string;
  thumbnail?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface IStatusHistory {
  status: OrderStatus;
  note?: string;
  changedBy?: Types.ObjectId;
  changedAt: Date;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  coupon?: { code: string; discount: number } | null;
  itemsTotal: number;
  discountTotal: number;
  shippingFee: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
  notes?: string;
  trackingNumber?: string;
  carrier?: string;
  statusHistory: IStatusHistory[];
  placedAt: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    thumbnail: { type: String },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const addressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: addressSchema, required: true },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHOD), required: true },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
      index: true,
    },
    paymentReference: { type: String },
    coupon: {
      type: { code: String, discount: Number },
      default: null,
    },
    itemsTotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    notes: { type: String, maxlength: 500 },
    trackingNumber: { type: String },
    carrier: { type: String },
    statusHistory: [
      {
        status: { type: String, enum: Object.values(ORDER_STATUS) },
        note: String,
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    placedAt: { type: Date, default: Date.now, index: true },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = model<IOrder>('Order', orderSchema);
