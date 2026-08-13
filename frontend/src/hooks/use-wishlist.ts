'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';
import type { Product } from '@/types';

export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<Product[]>({
    queryKey: queryKeys.wishlist,
    queryFn: api.wishlist.list,
    enabled: isAuthenticated,
  });
}

export function useWishlistMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.wishlist });

  const add = useMutation({
    mutationFn: (productId: string) => api.wishlist.add(productId),
    onSuccess: () => {
      invalidate();
      toast.success('Saved to wishlist');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (productId: string) => api.wishlist.remove(productId),
    onSuccess: () => {
      invalidate();
      toast.success('Removed from wishlist');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return { add, remove };
}
