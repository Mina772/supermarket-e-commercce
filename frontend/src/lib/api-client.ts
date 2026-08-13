import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiEnvelope } from '@/types';

const BASE_URL = '/api/v1';

/** In-memory access token (refresh token lives in an httpOnly cookie). */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) window.localStorage.setItem('accessToken', token);
    else window.localStorage.removeItem('accessToken');
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') accessToken = window.localStorage.getItem('accessToken');
  return accessToken;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Transparent refresh-token rotation on 401.
let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            if (!token) return reject(error);
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            resolve(apiClient(original));
          });
        });
      }
      isRefreshing = true;
      try {
        const { data } = await axios.post<ApiEnvelope<{ accessToken: string }>>(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        queue.forEach((cb) => cb(newToken));
        queue = [];
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return apiClient(original);
      } catch (refreshErr) {
        queue.forEach((cb) => cb(null));
        queue = [];
        setAccessToken(null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

/** Normalizes API errors into a readable message for toasts. */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiEnvelope<unknown> | undefined;
    return data?.message || error.message || 'Something went wrong';
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}
