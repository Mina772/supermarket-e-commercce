import { apiClient } from './api-client';
import { buildQueryString } from './utils';
import type {
  Address,
  ApiEnvelope,
  Brand,
  CartView,
  Category,
  Coupon,
  DashboardMetrics,
  Order,
  PaginationMeta,
  Product,
  Review,
  User,
} from '@/types';

export interface Paginated<T> {
  items: T[];
  meta?: PaginationMeta & Record<string, unknown>;
}

async function get<T>(url: string): Promise<T> {
  const { data } = await apiClient.get<ApiEnvelope<T>>(url);
  return data.data;
}
async function getList<T>(url: string): Promise<Paginated<T>> {
  const { data } = await apiClient.get<ApiEnvelope<T[]>>(url);
  return { items: data.data, meta: data.meta };
}
async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.post<ApiEnvelope<T>>(url, body);
  return data.data;
}
async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.patch<ApiEnvelope<T>>(url, body);
  return data.data;
}
async function del<T>(url: string): Promise<T> {
  const { data } = await apiClient.delete<ApiEnvelope<T>>(url);
  return data.data;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: string;
  onDeal?: string;
  featured?: string;
}

export const api = {
  auth: {
    register: (b: Record<string, unknown>) => post<{ user: User; accessToken: string }>('/auth/register', b),
    login: (b: { email: string; password: string }) =>
      post<{ user: User; accessToken: string }>('/auth/login', b),
    logout: () => post('/auth/logout'),
    me: () => get<User>('/auth/me'),
    updateProfile: (b: Partial<User>) => patch<User>('/auth/me', b),
    forgotPassword: (email: string) => post('/auth/forgot-password', { email }),
    resetPassword: (b: { token: string; password: string }) => post('/auth/reset-password', b),
    changePassword: (b: { currentPassword: string; newPassword: string }) =>
      post('/auth/change-password', b),
  },
  products: {
    list: (q: ProductQuery = {}) => getList<Product>(`/products${buildQueryString(q as Record<string, string | number | null | undefined>)}`),
    detail: (idOrSlug: string) => get<Product>(`/products/${idOrSlug}`),
    featured: (limit = 12) => get<Product[]>(`/products/featured?limit=${limit}`),
    bestSellers: (limit = 12) => get<Product[]>(`/products/best-sellers?limit=${limit}`),
    deals: (limit = 12) => get<Product[]>(`/products/deals?limit=${limit}`),
    flashSales: (limit = 12) => get<Product[]>(`/products/flash-sales?limit=${limit}`),
    related: (idOrSlug: string, limit = 8) => get<Product[]>(`/products/${idOrSlug}/related?limit=${limit}`),
    create: (b: Record<string, unknown>) => post<Product>('/products', b),
    update: (id: string, b: Record<string, unknown>) => patch<Product>(`/products/${id}`, b),
    remove: (id: string) => del(`/products/${id}`),
  },
  categories: {
    list: (featured?: boolean) => getList<Category>(`/categories${featured ? '?featured=true&limit=100' : '?limit=100'}`),
    detail: (idOrSlug: string) => get<Category>(`/categories/${idOrSlug}`),
    create: (b: Record<string, unknown>) => post<Category>('/categories', b),
    update: (id: string, b: Record<string, unknown>) => patch<Category>(`/categories/${id}`, b),
    remove: (id: string) => del(`/categories/${id}`),
  },
  brands: {
    list: (featured?: boolean) => getList<Brand>(`/brands${featured ? '?featured=true&limit=100' : '?limit=100'}`),
    detail: (idOrSlug: string) => get<Brand>(`/brands/${idOrSlug}`),
  },
  cart: {
    view: () => get<CartView>('/cart'),
    addItem: (productId: string, quantity = 1) => post<CartView>('/cart/items', { productId, quantity }),
    updateItem: (productId: string, quantity: number) => patch<CartView>(`/cart/items/${productId}`, { quantity }),
    removeItem: (productId: string) => del<CartView>(`/cart/items/${productId}`),
    clear: () => del<CartView>('/cart'),
    applyCoupon: (code: string) => post<CartView>('/cart/coupon', { code }),
    removeCoupon: () => del<CartView>('/cart/coupon'),
  },
  orders: {
    checkout: (b: Record<string, unknown>) => post<Order>('/orders/checkout', b),
    mine: (page = 1) => getList<Order>(`/orders?page=${page}`),
    detail: (id: string) => get<Order>(`/orders/${id}`),
    cancel: (id: string) => post<Order>(`/orders/${id}/cancel`),
    all: (q: Record<string, string | number> = {}) => getList<Order>(`/orders/admin/all${buildQueryString(q)}`),
    updateStatus: (id: string, status: string, note?: string) =>
      patch<Order>(`/orders/${id}/status`, { status, note }),
  },
  reviews: {
    forProduct: (productId: string, page = 1) => getList<Review>(`/reviews/product/${productId}?page=${page}`),
    create: (b: Record<string, unknown>) => post<Review>('/reviews', b),
    queue: (status?: string) => getList<Review>(`/reviews${status ? `?status=${status}` : ''}`),
    moderate: (id: string, status: string) => patch<Review>(`/reviews/${id}/moderate`, { status }),
    remove: (id: string) => del(`/reviews/${id}`),
  },
  coupons: {
    validate: (code: string) => get<Coupon>(`/coupons/validate/${code}`),
    list: () => getList<Coupon>('/coupons'),
    create: (b: Record<string, unknown>) => post<Coupon>('/coupons', b),
    update: (id: string, b: Record<string, unknown>) => patch<Coupon>(`/coupons/${id}`, b),
    remove: (id: string) => del(`/coupons/${id}`),
  },
  addresses: {
    list: () => get<Address[]>('/addresses'),
    create: (b: Address) => post<Address>('/addresses', b),
    update: (id: string, b: Partial<Address>) => patch<Address>(`/addresses/${id}`, b),
    remove: (id: string) => del(`/addresses/${id}`),
  },
  notifications: {
    list: (page = 1) => getList<{ _id: string; title: string; message: string; isRead: boolean; createdAt: string; link?: string }>(`/notifications?page=${page}`),
    read: (id: string) => patch(`/notifications/${id}/read`),
    readAll: () => patch('/notifications/read-all'),
  },
  wishlist: {
    list: () => get<Product[]>('/users/me/wishlist'),
    add: (productId: string) => post(`/users/me/wishlist/${productId}`),
    remove: (productId: string) => del(`/users/me/wishlist/${productId}`),
  },
  users: {
    list: (q: Record<string, string | number> = {}) => getList<User>(`/users${buildQueryString(q)}`),
    setRole: (id: string, role: string) => patch<User>(`/users/${id}/role`, { role }),
    setStatus: (id: string, isActive: boolean) => patch<User>(`/users/${id}/status`, { isActive }),
  },
  inventory: {
    lowStock: () => get<Product[]>('/inventory/low-stock'),
    outOfStock: () => get<Product[]>('/inventory/out-of-stock'),
    adjust: (productId: string, b: { change: number; reason: string; reference?: string }) =>
      post<Product>(`/inventory/adjust/${productId}`, b),
  },
  analytics: {
    dashboard: () => get<DashboardMetrics>('/analytics/dashboard'),
    sales: (days = 30) => get<{ date: string; revenue: number; orders: number }[]>(`/analytics/sales?days=${days}`),
    topProducts: (limit = 10) => get<Product[]>(`/analytics/top-products?limit=${limit}`),
    ordersByStatus: () => get<{ status: string; count: number }[]>('/analytics/orders-by-status'),
  },
};
