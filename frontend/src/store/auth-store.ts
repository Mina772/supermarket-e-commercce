import { create } from 'zustand';
import { api } from '@/lib/api';
import { getAccessToken, setAccessToken } from '@/lib/api-client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: Record<string, unknown>) => Promise<User>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isStaff: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
      isStaff: user?.role === 'admin' || user?.role === 'manager',
    }),

  login: async (email, password) => {
    const { user, accessToken } = await api.auth.login({ email, password });
    setAccessToken(accessToken);
    set({ user, isAuthenticated: true, isStaff: user.role === 'admin' || user.role === 'manager' });
    return user;
  },

  register: async (payload) => {
    const { user, accessToken } = await api.auth.register(payload);
    setAccessToken(accessToken);
    set({ user, isAuthenticated: true, isStaff: user.role === 'admin' || user.role === 'manager' });
    return user;
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } finally {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, isStaff: false });
    }
  },

  hydrate: async () => {
    if (!getAccessToken()) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await api.auth.me();
      set({
        user,
        isAuthenticated: true,
        isStaff: user.role === 'admin' || user.role === 'manager',
        isLoading: false,
      });
    } catch {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
