'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, type ProductQuery } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: queryKeys.products.list(query),
    queryFn: () => api.products.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(idOrSlug: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(idOrSlug),
    queryFn: () => api.products.detail(idOrSlug),
    enabled: Boolean(idOrSlug),
  });
}

export function useCategories(featured?: boolean) {
  return useQuery({
    queryKey: [...queryKeys.categories, { featured }],
    queryFn: () => api.categories.list(featured),
  });
}

export function useBrands(featured?: boolean) {
  return useQuery({
    queryKey: [...queryKeys.brands, { featured }],
    queryFn: () => api.brands.list(featured),
  });
}
