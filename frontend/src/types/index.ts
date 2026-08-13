export type Role = 'admin' | 'manager' | 'customer';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta & Record<string, unknown>;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  unread?: number;
}

export interface User {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  wishlist?: string[];
  createdAt: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  productCount?: number;
  isFeatured?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  productCount?: number;
  isFeatured?: boolean;
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface Nutrition {
  servingSize?: string;
  calories?: number;
  fat?: number;
  carbohydrates?: number;
  sugars?: number;
  protein?: number;
  salt?: number;
  fiber?: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  description: string;
  shortDescription?: string;
  brand?: Brand | string;
  category: Category | string;
  price: number;
  compareAtPrice?: number;
  discountPercentage: number;
  finalPrice?: number;
  currency: string;
  unit: string;
  images: ProductImage[];
  thumbnail?: string;
  stock: number;
  tags: string[];
  nutrition?: Nutrition;
  rating: number;
  reviewCount: number;
  soldCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isOnDeal: boolean;
  isFlashSale: boolean;
  flashSaleEndsAt?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  priceSnapshot: number;
}

export interface CartTotals {
  itemsTotal: number;
  discountTotal: number;
  shippingFee: number;
  taxTotal: number;
  grandTotal: number;
}

export interface CartView {
  cart: { _id: string; items: CartItem[]; coupon?: unknown };
  totals: CartTotals;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  product: string;
  name: string;
  sku: string;
  thumbnail?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  itemsTotal: number;
  discountTotal: number;
  shippingFee: number;
  taxTotal: number;
  grandTotal: number;
  shippingAddress: Address;
  trackingNumber?: string;
  statusHistory: { status: OrderStatus; changedAt: string; note?: string }[];
  createdAt: string;
}

export interface Address {
  _id?: string;
  label?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface Review {
  _id: string;
  product: string | Product;
  user: Pick<User, 'firstName' | 'lastName' | 'avatar'> | string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
}

export interface DashboardMetrics {
  revenue: number;
  paidOrders: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStock: number;
  totalCustomers: number;
  pendingReviews: number;
  averageOrderValue: number;
}
