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

import { TooltipProvider } from '@/components/ui/tooltip';
import { useThemeStore } from '@/stores/theme.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

function ThemedToaster() {
  const theme = useThemeStore((s) => s.theme);
  const dark = theme === 'dark';
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: dark ? 'rgba(19,19,31,0.92)' : '#ffffff',
          backdropFilter: dark ? 'blur(16px)' : undefined,
          color: dark ? '#E8E8F0' : '#18181b',
          border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          borderRadius: '14px',
          padding: '12px 16px',
          fontSize: '13px',
          boxShadow: dark
            ? '0 30px 80px -30px rgba(0,0,0,0.75)'
            : '0 16px 40px -16px rgba(0,0,0,0.18)',
        },
        success: { iconTheme: { primary: '#7c3aed', secondary: dark ? '#0B0B17' : '#fff' } },
        error:   { iconTheme: { primary: '#e11d48', secondary: dark ? '#0B0B17' : '#fff' } },
      }}
    />
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <BrowserRouter>
          <ThemedToaster />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}
