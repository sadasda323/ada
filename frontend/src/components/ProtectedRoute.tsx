import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuth = useAuthStore((s) => s.accessToken && s.user);
  const location = useLocation();
  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
