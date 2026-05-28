import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse, User } from '@/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (a: AuthResponse) => void;
  setAccessToken: (t: string) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (a) =>
        set({ accessToken: a.accessToken, refreshToken: a.refreshToken, user: a.user }),
      setAccessToken: (t) => set({ accessToken: t }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      isAuthenticated: () => !!get().accessToken && !!get().user,
    }),
    { name: 'hrco-auth' },
  ),
);
