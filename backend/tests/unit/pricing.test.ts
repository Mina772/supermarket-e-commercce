import { calculateTotals } from '../../src/common/utils/pricing';
import { DISCOUNT_TYPE } from '../../src/modules/coupons/coupon.model';

describe('pricing engine', () => {
  it('sums items and applies free shipping over threshold', () => {
    const r = calculateTotals([{ price: 30, quantity: 2 }]); // 60 -> free shipping
    expect(r.itemsTotal).toBe(60);
    expect(r.shippingFee).toBe(0);
    expect(r.taxTotal).toBe(4.8);
    expect(r.grandTotal).toBe(64.8);
  });

  it('charges shipping below threshold', () => {
    const r = calculateTotals([{ price: 10, quantity: 1 }]);
    expect(r.shippingFee).toBe(4.99);
  });

  it('applies a percentage coupon with a max cap', () => {
    const r = calculateTotals([{ price: 100, quantity: 1 }], {
      discountType: DISCOUNT_TYPE.PERCENTAGE,
      discountValue: 20,
      maxDiscountAmount: 15,
      minOrderAmount: 0,
    });
    expect(r.discountTotal).toBe(15);
  });

  it('ignores a coupon under its minimum order amount', () => {
    const r = calculateTotals([{ price: 10, quantity: 1 }], {
      discountType: DISCOUNT_TYPE.FIXED,
      discountValue: 5,
      minOrderAmount: 50,
    });
    expect(r.discountTotal).toBe(0);
  });
});
