'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/auth-store';
import type { CartView } from '@/types';

export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<CartView>({
    queryKey: queryKeys.cart,
    queryFn: api.cart.view,
    enabled: isAuthenticated,
  });
}

export function useCartMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.cart });
  const onError = (e: unknown) => toast.error(getApiErrorMessage(e));

  const addItem = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) =>
      api.cart.addItem(productId, quantity ?? 1),
    onSuccess: () => {
      invalidate();
      toast.success('Added to cart');
    },
    onError,
  });

  const updateItem = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.cart.updateItem(productId, quantity),
    onSuccess: invalidate,
    onError,
  });

  const removeItem = useMutation({
    mutationFn: (productId: string) => api.cart.removeItem(productId),
    onSuccess: () => {
      invalidate();
      toast.success('Removed from cart');
    },
    onError,
  });

  const clear = useMutation({
    mutationFn: api.cart.clear,
    onSuccess: invalidate,
    onError,
  });

  const applyCoupon = useMutation({
    mutationFn: (code: string) => api.cart.applyCoupon(code),
    onSuccess: () => {
      invalidate();
      toast.success('Coupon applied');
    },
    onError,
  });

  const removeCoupon = useMutation({
    mutationFn: api.cart.removeCoupon,
    onSuccess: invalidate,
    onError,
  });

  return { addItem, updateItem, removeItem, clear, applyCoupon, removeCoupon };
}
