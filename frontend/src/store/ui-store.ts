import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface CompareState {
  items: Product[];
  toggle: (product: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) => {
        const exists = get().items.some((p) => p._id === product._id);
        if (exists) {
          set({ items: get().items.filter((p) => p._id !== product._id) });
        } else if (get().items.length < 4) {
          set({ items: [...get().items, product] });
        }
      },
      remove: (id) => set({ items: get().items.filter((p) => p._id !== id) }),
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((p) => p._id === id),
    }),
    { name: 'compare-store' },
  ),
);

interface UiState {
  isCartOpen: boolean;
  isSearchOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isCartOpen: false,
  isSearchOpen: false,
  setCartOpen: (isCartOpen) => set({ isCartOpen }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
}));
