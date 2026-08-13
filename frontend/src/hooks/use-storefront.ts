'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useFeatured(limit = 10) {
  return useQuery({ queryKey: ['products', 'featured', limit], queryFn: () => api.products.featured(limit) });
}
export function useBestSellers(limit = 10) {
  return useQuery({ queryKey: ['products', 'best-sellers', limit], queryFn: () => api.products.bestSellers(limit) });
}
export function useDeals(limit = 10) {
  return useQuery({ queryKey: ['products', 'deals', limit], queryFn: () => api.products.deals(limit) });
}
export function useFlashSales(limit = 10) {
  return useQuery({ queryKey: ['products', 'flash-sales', limit], queryFn: () => api.products.flashSales(limit) });
}
export function useRelated(idOrSlug: string, limit = 8) {
  return useQuery({
    queryKey: ['products', 'related', idOrSlug, limit],
    queryFn: () => api.products.related(idOrSlug, limit),
    enabled: Boolean(idOrSlug),
  });
}
