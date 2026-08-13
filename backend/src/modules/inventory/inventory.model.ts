import { Schema, model, Document, Types } from 'mongoose';

export const INVENTORY_REASON = {
  PURCHASE: 'purchase',
  SALE: 'sale',
  RETURN: 'return',
  ADJUSTMENT: 'adjustment',
  DAMAGE: 'damage',
  RESTOCK: 'restock',
} as const;
export type InventoryReason = (typeof INVENTORY_REASON)[keyof typeof INVENTORY_REASON];

export interface IInventoryLog extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  change: number; // +restock / -sale
  balanceAfter: number;
  reason: InventoryReason;
  reference?: string;
  performedBy?: Types.ObjectId;
  createdAt: Date;
}

const inventoryLogSchema = new Schema<IInventoryLog>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    change: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: { type: String, enum: Object.values(INVENTORY_REASON), required: true },
    reference: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

inventoryLogSchema.index({ product: 1, createdAt: -1 });

export const InventoryLog = model<IInventoryLog>('InventoryLog', inventoryLogSchema);
