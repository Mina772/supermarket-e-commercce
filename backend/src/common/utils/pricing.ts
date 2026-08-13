import { ICoupon, DISCOUNT_TYPE } from '../../modules/coupons/coupon.model';

export interface PriceableItem {
  price: number;
  quantity: number;
}

export interface PricingResult {
  itemsTotal: number;
  discountTotal: number;
  shippingFee: number;
  taxTotal: number;
  grandTotal: number;
}

export interface PricingConfig {
  taxRate: number; // e.g. 0.08
  freeShippingThreshold: number;
  baseShippingFee: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  taxRate: 0.08,
  freeShippingThreshold: 50,
  baseShippingFee: 4.99,
};

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Computes a fully itemized order/cart total including coupon, tax & shipping. */
export function calculateTotals(
  items: PriceableItem[],
  coupon?: Pick<ICoupon, 'discountType' | 'discountValue' | 'maxDiscountAmount' | 'minOrderAmount'> | null,
  config: PricingConfig = DEFAULT_PRICING,
): PricingResult {
  const itemsTotal = round(items.reduce((sum, i) => sum + i.price * i.quantity, 0));

  let discountTotal = 0;
  if (coupon && itemsTotal >= (coupon.minOrderAmount ?? 0)) {
    if (coupon.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      discountTotal = (itemsTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) discountTotal = Math.min(discountTotal, coupon.maxDiscountAmount);
    } else {
      discountTotal = coupon.discountValue;
    }
    discountTotal = round(Math.min(discountTotal, itemsTotal));
  }

  const taxableBase = Math.max(0, itemsTotal - discountTotal);
  const taxTotal = round(taxableBase * config.taxRate);
  const shippingFee =
    itemsTotal >= config.freeShippingThreshold || itemsTotal === 0 ? 0 : config.baseShippingFee;
  const grandTotal = round(taxableBase + taxTotal + shippingFee);

  return { itemsTotal, discountTotal, shippingFee, taxTotal, grandTotal };
}
