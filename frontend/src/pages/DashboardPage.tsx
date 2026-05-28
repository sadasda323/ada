import { useQuery } from '@tanstack/react-query';
import { Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { dashboardApi } from '@/services/api.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatCOP } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

const rolLabel: Record<string, string> = {
  ADMIN_EMPRESA: 'Administrador de Empresa',
  RRHH: 'Recursos Humanos',
  CONTADOR: 'Contador',
  EMPLEADO: 'Empleado',
};

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
}

function KpiCard({ title, value, subtitle, icon: Icon, trend }: KpiCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-500">{title}</h4>
        <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        {trend !== undefined && trend !== 0 && (
          <span
            className={
              'text-xs font-medium ' + (trend > 0 ? 'text-emerald-600' : 'text-red-600')
            }
          >
            {trend > 0 ? '+' : ''}
            {trend.toFixed(1)}%
          </span>
        )}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.kpis,
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          Bienvenido, {user?.nombre} <span className="text-2xl">👋</span>
        </h1>
        <p className="text-sm text-slate-600">
          {rolLabel[user?.rol ?? ''] || user?.rol} · Aquí puedes gestionar toda tu empresa desde un solo lugar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Empleados activos"
          value={isLoading ? '—' : String(data?.empleadosActivos ?? 0)}
          subtitle={isLoading ? 'Cargando…' : `Total: ${data?.totalEmpleados ?? 0}`}
          icon={Users}
        />
        <KpiCard
          title="Nómina del mes"
          value={isLoading ? '—' : formatCOP(data?.nominaDelMes)}
          subtitle={data?.ultimoPeriodo ? `Último período: ${data.ultimoPeriodo.nombre}` : 'Sin períodos aún'}
          icon={DollarSign}
        />
        <KpiCard
          title="Novedades pendientes"
          value={isLoading ? '—' : String(data?.novedadesPendientes ?? 0)}
          subtitle={data?.novedadesPendientes ? 'Requieren aprobación' : 'Todo al día'}
          icon={Clock}
        />
        <KpiCard
          title="Crecimiento"
          value={isLoading ? '—' : `${(data?.crecimientoEmpleados ?? 0).toFixed(1)}%`}
          subtitle="Empleados vs mes anterior"
          icon={TrendingUp}
          trend={data?.crecimientoEmpleados}
        />
      </div>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-slate-900">Panel principal</h2>
        <p className="text-sm text-slate-500 mt-1">
          Resumen estructural de tu empresa.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Áreas</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{data?.totalAreas ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Cargos</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{data?.totalCargos ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Empleados totales</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{data?.totalEmpleados ?? 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
