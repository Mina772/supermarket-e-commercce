import { Types } from 'mongoose';
import { IOrder, Order, ORDER_STATUS, OrderStatus, PaymentMethod, PAYMENT_STATUS } from './order.model';
import { Cart } from '../cart/cart.model';
import { Product } from '../products/product.model';
import { Coupon } from '../coupons/coupon.model';
import { InventoryLog, INVENTORY_REASON } from '../inventory/inventory.model';
import { Notification, NOTIFICATION_TYPE } from '../notifications/notification.model';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors/AppError';
import { calculateTotals } from '../../common/utils/pricing';
import { QueryOptions } from '../../common/utils/pagination';
import { IShippingAddress } from './order.model';

export interface CheckoutInput {
  shippingAddress: IShippingAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
}

/** Valid forward status transitions (a simple, auditable state machine). */
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'processing', 'cancelled'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

export class OrderService {
  async checkout(userId: string, input: CheckoutInput): Promise<IOrder> {
    const cart = await Cart.findOne({ user: userId }).populate('items.product').populate('coupon');
    if (!cart || cart.items.length === 0) throw new BadRequestError('Your cart is empty');

    // Build order items from live product data & validate stock.
    const decremented: { id: Types.ObjectId; qty: number }[] = [];
    const orderItems = [];
    try {
      for (const item of cart.items) {
        const product = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity }, isActive: true },
          { $inc: { stock: -item.quantity, soldCount: item.quantity } },
          { new: true },
        );
        if (!product) {
          throw new BadRequestError(`Insufficient stock for one or more items`);
        }
        decremented.push({ id: product._id, qty: item.quantity });
        orderItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          thumbnail: product.thumbnail,
          price: product.finalPrice,
          quantity: item.quantity,
          subtotal: Math.round(product.finalPrice * item.quantity * 100) / 100,
        });
        await InventoryLog.create({
          product: product._id,
          change: -item.quantity,
          balanceAfter: product.stock,
          reason: INVENTORY_REASON.SALE,
          performedBy: new Types.ObjectId(userId),
        });
      }

      const coupon = cart.coupon as unknown as {
        _id: Types.ObjectId;
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        maxDiscountAmount?: number;
        minOrderAmount: number;
      } | null;

      const totals = calculateTotals(
        orderItems.map((i) => ({ price: i.price, quantity: i.quantity })),
        coupon,
      );

      const order = await Order.create({
        orderNumber: this.generateOrderNumber(),
        user: new Types.ObjectId(userId),
        items: orderItems,
        shippingAddress: input.shippingAddress,
        paymentMethod: input.paymentMethod,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        status: ORDER_STATUS.PENDING,
        coupon: coupon ? { code: coupon.code, discount: totals.discountTotal } : null,
        itemsTotal: totals.itemsTotal,
        discountTotal: totals.discountTotal,
        shippingFee: totals.shippingFee,
        taxTotal: totals.taxTotal,
        grandTotal: totals.grandTotal,
        notes: input.notes,
        statusHistory: [{ status: ORDER_STATUS.PENDING, changedAt: new Date() }],
      });

      if (coupon) {
        await Coupon.updateOne(
          { _id: coupon._id },
          {
            $inc: { usedCount: 1 },
            $push: { usedBy: { user: new Types.ObjectId(userId), count: 1 } },
          },
        );
      }

      // Empty the cart after successful order creation.
      cart.items = [];
      cart.coupon = null;
      await cart.save();

      await Notification.create({
        user: userId,
        type: NOTIFICATION_TYPE.ORDER,
        title: 'Order placed',
        message: `Your order ${order.orderNumber} has been received.`,
        link: `/account/orders/${order._id}`,
      });

      return order;
    } catch (err) {
      // Compensating action: restore stock we decremented before failure.
      await Promise.all(
        decremented.map((d) =>
          Product.updateOne({ _id: d.id }, { $inc: { stock: d.qty, soldCount: -d.qty } }),
        ),
      );
      throw err;
    }
  }

  async listForUser(userId: string, options: QueryOptions): Promise<{ items: IOrder[]; total: number }> {
    const filter = { user: new Types.ObjectId(userId) };
    const [items, total] = await Promise.all([
      Order.find(filter).sort(options.sort).skip(options.skip).limit(options.limit).lean<IOrder[]>(),
      Order.countDocuments(filter),
    ]);
    return { items, total };
  }

  async listAll(options: QueryOptions, status?: string): Promise<{ items: IOrder[]; total: number }> {
    const filter = status ? { status } : {};
    const [items, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'firstName lastName email')
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit)
        .lean<IOrder[]>(),
      Order.countDocuments(filter),
    ]);
    return { items, total };
  }

  async getById(id: string, userId?: string, isStaff = false): Promise<IOrder> {
    const order = await Order.findById(id).populate('user', 'firstName lastName email');
    if (!order) throw new NotFoundError('Order not found');
    if (!isStaff && userId && order.user._id.toString() !== userId) {
      throw new ForbiddenError('You cannot access this order');
    }
    return order;
  }

  async updateStatus(id: string, status: OrderStatus, actorId: string, note?: string): Promise<IOrder> {
    const order = await Order.findById(id);
    if (!order) throw new NotFoundError('Order not found');

    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(status)) {
      throw new BadRequestError(`Cannot transition order from "${order.status}" to "${status}"`);
    }

    order.status = status;
    if (status === ORDER_STATUS.PAID) order.paymentStatus = PAYMENT_STATUS.PAID;
    if (status === ORDER_STATUS.DELIVERED) order.deliveredAt = new Date();
    if (status === ORDER_STATUS.CANCELLED) {
      order.cancelledAt = new Date();
      await this.restock(order, actorId);
    }
    if (status === ORDER_STATUS.REFUNDED) {
      order.paymentStatus = PAYMENT_STATUS.REFUNDED;
      await this.restock(order, actorId);
    }

    order.statusHistory.push({
      status,
      note,
      changedBy: new Types.ObjectId(actorId),
      changedAt: new Date(),
    });
    await order.save();

    await Notification.create({
      user: order.user,
      type: NOTIFICATION_TYPE.ORDER,
      title: `Order ${status}`,
      message: `Your order ${order.orderNumber} is now ${status}.`,
      link: `/account/orders/${order._id}`,
    });

    return order;
  }

  async cancelOwn(id: string, userId: string): Promise<IOrder> {
    const order = await this.getById(id, userId);
    if (![ORDER_STATUS.PENDING, ORDER_STATUS.PAID].includes(order.status as never)) {
      throw new BadRequestError('This order can no longer be cancelled');
    }
    return this.updateStatus(id, ORDER_STATUS.CANCELLED, userId, 'Cancelled by customer');
  }

  private async restock(order: IOrder, actorId: string): Promise<void> {
    await Promise.all(
      order.items.map(async (item) => {
        const product = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity, soldCount: -item.quantity } },
          { new: true },
        );
        if (product) {
          await InventoryLog.create({
            product: product._id,
            change: item.quantity,
            balanceAfter: product.stock,
            reason: INVENTORY_REASON.RETURN,
            reference: order.orderNumber,
            performedBy: new Types.ObjectId(actorId),
          });
        }
      }),
    );
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const y = date.getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `ORD-${y}-${rand}`;
  }
}

export const orderService = new OrderService();
