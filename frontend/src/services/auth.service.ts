import { api } from '@/lib/api';
import type { AuthResponse, Empresa, User } from '@/types';

export const authApi = {
  register: (payload: {
    empresa: { nit: string; razonSocial: string; nombreComercial?: string; email?: string; telefono?: string; ciudad?: string };
    admin: { nombre: string; apellido: string; email: string; password: string };
  }) => api.post<{ success: boolean; data: AuthResponse }>('/auth/register', payload).then((r) => r.data.data),

  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: AuthResponse }>('/auth/login', { email, password }).then((r) => r.data.data),

  me: () => api.get<{ success: boolean; data: { user: User; empresa: Empresa } }>('/auth/me').then((r) => r.data.data),

  logout: () => api.post('/auth/logout'),
};
