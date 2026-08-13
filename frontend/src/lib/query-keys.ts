import type { ProductQuery } from './api';

export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (q: ProductQuery) => ['products', 'list', q] as const,
    detail: (idOrSlug: string) => ['products', 'detail', idOrSlug] as const,
    featured: ['products', 'featured'] as const,
    bestSellers: ['products', 'best-sellers'] as const,
    deals: ['products', 'deals'] as const,
    flashSales: ['products', 'flash-sales'] as const,
    related: (id: string) => ['products', 'related', id] as const,
  },
  categories: ['categories'] as const,
  brands: ['brands'] as const,
  cart: ['cart'] as const,
  wishlist: ['wishlist'] as const,
  orders: {
    mine: ['orders', 'mine'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    all: (q: Record<string, unknown>) => ['orders', 'all', q] as const,
  },
  reviews: (productId: string) => ['reviews', productId] as const,
  notifications: ['notifications'] as const,
  addresses: ['addresses'] as const,
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    sales: (days: number) => ['admin', 'sales', days] as const,
    users: (q: Record<string, unknown>) => ['admin', 'users', q] as const,
    coupons: ['admin', 'coupons'] as const,
    lowStock: ['admin', 'low-stock'] as const,
    reviewQueue: (status?: string) => ['admin', 'reviews', status] as const,
  },
} as const;
