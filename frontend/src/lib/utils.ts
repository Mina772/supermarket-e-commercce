import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Product } from '@/types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value ?? 0);
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

/** Computes the discounted price from base price + discount percentage. */
export function finalPrice(product: Pick<Product, 'price' | 'discountPercentage' | 'finalPrice'>): number {
  if (typeof product.finalPrice === 'number') return product.finalPrice;
  const p = product.price * (1 - (product.discountPercentage || 0) / 100);
  return Math.round(p * 100) / 100;
}

export function productImage(product: Pick<Product, 'thumbnail' | 'images'>): string {
  return (
    product.thumbnail ||
    product.images?.find((i) => i.isPrimary)?.url ||
    product.images?.[0]?.url ||
    '/placeholder.svg'
  );
}

export function truncate(text: string, length = 80): string {
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}

export function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'U';
}

export function buildQueryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}
