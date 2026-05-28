import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthResponse } from '@/types';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

// ── Request: inyecta access token ─────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: refresh automático en 401 ───────────────────────────────────────
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const rt = useAuthStore.getState().refreshToken;
  if (!rt) return null;
  try {
    const res = await axios.post<{ success: boolean; data: AuthResponse }>(
      `${API_URL}/auth/refresh`,
      { refreshToken: rt },
      { headers: { 'Content-Type': 'application/json' } },
    );
    if (res.data?.success) {
      useAuthStore.getState().setAuth(res.data.data);
      return res.data.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original?._retry && original?.url !== '/auth/refresh') {
      original._retry = true;
      if (!refreshing) refreshing = refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` };
        return api(original);
      }
      useAuthStore.getState().clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ── Helper para extraer mensaje de error del backend ─────────────────────────
export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message || err.message || 'Error de red';
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}
