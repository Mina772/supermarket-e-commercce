import { Types } from 'mongoose';
import { Cart, ICart } from './cart.model';
import { Product } from '../products/product.model';
import { Coupon } from '../coupons/coupon.model';
import { BadRequestError, NotFoundError } from '../../common/errors/AppError';
import { calculateTotals, PricingResult } from '../../common/utils/pricing';

export interface CartView {
  cart: ICart;
  totals: PricingResult;
}

export class CartService {
  private async getOrCreate(userId: string): Promise<ICart> {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = await Cart.create({ user: userId, items: [] });
    return cart;
  }

  async view(userId: string): Promise<CartView> {
    const cart = await this.getOrCreate(userId);
    await cart.populate([
      { path: 'items.product', select: 'name slug thumbnail price discountPercentage stock unit isActive' },
      { path: 'coupon' },
    ]);
    return this.buildView(cart);
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartView> {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) throw new NotFoundError('Product not found');
    if (product.stock < quantity) throw new BadRequestError('Insufficient stock for requested quantity');

    const cart = await this.getOrCreate(userId);
    const existing = cart.items.find((i) => i.product.toString() === productId);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock < newQty) throw new BadRequestError('Insufficient stock');
      existing.quantity = newQty;
      existing.priceSnapshot = product.finalPrice;
    } else {
      cart.items.push({
        product: new Types.ObjectId(productId),
        quantity,
        priceSnapshot: product.finalPrice,
      });
    }
    await cart.save();
    return this.view(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number): Promise<CartView> {
    const cart = await this.getOrCreate(userId);
    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) throw new NotFoundError('Item not in cart');

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    } else {
      const product = await Product.findById(productId);
      if (!product) throw new NotFoundError('Product not found');
      if (product.stock < quantity) throw new BadRequestError('Insufficient stock');
      item.quantity = quantity;
      item.priceSnapshot = product.finalPrice;
    }
    await cart.save();
    return this.view(userId);
  }

  async removeItem(userId: string, productId: string): Promise<CartView> {
    const cart = await this.getOrCreate(userId);
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    await cart.save();
    return this.view(userId);
  }

  async clear(userId: string): Promise<CartView> {
    const cart = await this.getOrCreate(userId);
    cart.items = [];
    cart.coupon = null;
    await cart.save();
    return this.view(userId);
  }

  async applyCoupon(userId: string, code: string): Promise<CartView> {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) throw new NotFoundError('Coupon not found');
    const now = new Date();
    if (coupon.expiresAt && coupon.expiresAt < now) throw new BadRequestError('Coupon expired');
    if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestError('Coupon not yet active');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestError('Coupon usage limit reached');
    }

    const cart = await this.getOrCreate(userId);
    cart.coupon = coupon._id;
    await cart.save();
    return this.view(userId);
  }

  async removeCoupon(userId: string): Promise<CartView> {
    const cart = await this.getOrCreate(userId);
    cart.coupon = null;
    await cart.save();
    return this.view(userId);
  }

  private buildView(cart: ICart): CartView {
    const items = cart.items.map((i) => ({ price: i.priceSnapshot, quantity: i.quantity }));
    const coupon = cart.coupon as unknown as {
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      maxDiscountAmount?: number;
      minOrderAmount: number;
    } | null;
    const totals = calculateTotals(items, coupon);
    return { cart, totals };
  }
}

export const cartService = new CartService();
