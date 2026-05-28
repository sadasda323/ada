import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EmpleadosPage } from '@/pages/EmpleadosPage';
import { CargosPage } from '@/pages/CargosPage';
import { AreasPage } from '@/pages/AreasPage';
import { NominaPage } from '@/pages/NominaPage';
import { NovedadesPage } from '@/pages/NovedadesPage';
import { ReportesPage } from '@/pages/ReportesPage';
import { ConfiguracionPage } from '@/pages/ConfiguracionPage';
import { UsuariosPage } from '@/pages/UsuariosPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/empleados" element={<EmpleadosPage />} />
            <Route path="/cargos" element={<CargosPage />} />
            <Route path="/areas" element={<AreasPage />} />
            <Route path="/nomina" element={<NominaPage />} />
            <Route path="/novedades" element={<NovedadesPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
