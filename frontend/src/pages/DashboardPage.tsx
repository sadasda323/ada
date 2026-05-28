import { useQuery } from '@tanstack/react-query';
import {
  Users, DollarSign, Clock, TrendingUp, ArrowUpRight,
  Activity, Sparkles, Calendar, Building2, Briefcase,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { dashboardApi, novedadesApi } from '@/services/api.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatCOP, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AnimatedCounter,
  Stagger,
  StaggerItem,
} from '@/components/ui/motion';

const rolLabel: Record<string, string> = {
  ADMIN_EMPRESA: 'Administrador de Empresa',
  RRHH: 'Recursos Humanos',
  CONTADOR: 'Contador',
  EMPLEADO: 'Empleado',
};

interface KpiCardProps {
  title: string;
  value: number | string;
  rawNumber?: number;
  format?: (n: number) => string;
  loading?: boolean;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  accent: 'violet' | 'fuchsia' | 'cyan' | 'amber';
}

const accentStyles = {
  violet:  {
    gradient: 'from-zinc-100 to-transparent dark:from-violet-500/20 dark:via-violet-500/5 dark:to-transparent',
    icon: 'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-400/20',
    blur: 'bg-zinc-200/30 dark:bg-violet-500/30',
  },
  fuchsia: {
    gradient: 'from-zinc-100 to-transparent dark:from-fuchsia-500/20 dark:via-fuchsia-500/5 dark:to-transparent',
    icon: 'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:border-fuchsia-400/20',
    blur: 'bg-zinc-200/30 dark:bg-fuchsia-500/30',
  },
  cyan: {
    gradient: 'from-zinc-100 to-transparent dark:from-cyan-500/20 dark:via-cyan-500/5 dark:to-transparent',
    icon: 'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-400/20',
    blur: 'bg-zinc-200/30 dark:bg-cyan-500/30',
  },
  amber: {
    gradient: 'from-zinc-100 to-transparent dark:from-amber-500/20 dark:via-amber-500/5 dark:to-transparent',
    icon: 'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/20',
    blur: 'bg-zinc-200/30 dark:bg-amber-500/30',
  },
};

function KpiCard({ title, value, rawNumber, format, loading, subtitle, icon: Icon, trend, accent }: KpiCardProps) {
  const a = accentStyles[accent];

  return (
    <StaggerItem>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="group relative overflow-hidden rounded-2xl bg-white border border-zinc-200/80 shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-ink-800/40 dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-card-dark dark:hover:shadow-elevated-dark"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
        <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full ${a.blur} blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`} />
        <div className="relative p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h4>
            <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${a.icon}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 h-display text-3xl font-bold text-zinc-900 dark:text-white tracking-tight2 tabular-nums">
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : rawNumber !== undefined ? (
              <AnimatedCounter value={rawNumber} format={format} />
            ) : (
              value
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend !== undefined && trend !== 0 && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                  trend > 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
                }`}
              >
                <ArrowUpRight className={`h-3 w-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(trend).toFixed(1)}%
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>
    </StaggerItem>
  );
}

const tipoColor: Record<string, string> = {
  HORAS_EXTRA_DIURNA: 'cyan',
  HORAS_EXTRA_NOCTURNA: 'cyan',
  HORAS_EXTRA_DOMINICAL: 'cyan',
  BONIFICACION: 'success',
  COMISION: 'success',
  VACACIONES: 'info',
  INCAPACIDAD: 'warning',
  DEDUCCION: 'danger',
  PRESTAMO: 'danger',
};

const tipoLabel: Record<string, string> = {
  INCAPACIDAD: 'Incapacidad',
  VACACIONES: 'Vacaciones',
  HORAS_EXTRA_DIURNA: 'H.E. diurna',
  HORAS_EXTRA_NOCTURNA: 'H.E. nocturna',
  HORAS_EXTRA_DOMINICAL: 'H.E. dominical',
  BONIFICACION: 'Bonificación',
  COMISION: 'Comisión',
  DEDUCCION: 'Deducción',
  PRESTAMO: 'Préstamo',
  LICENCIA: 'Licencia',
  AUSENCIA: 'Ausencia',
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.kpis,
    refetchInterval: 60_000,
  });
  const novedadesQ = useQuery({
    queryKey: ['novedades-recent'],
    queryFn: () => novedadesApi.list({ pageSize: 6 }),
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-transparent dark:ring-gradient"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-white dark:from-violet-700/40 dark:via-fuchsia-600/20 dark:to-cyan-500/15 dark:bg-[length:200%_100%] dark:animate-gradient-x" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid-32 opacity-[0.06] dark:opacity-[0.04]" />
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-zinc-200/40 dark:bg-fuchsia-500/30 blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-zinc-200/40 dark:bg-violet-600/30 blur-3xl" />

        <div className="relative px-6 sm:px-10 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="section-eyebrow flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> Tu panel
            </span>
            <h1 className="mt-2 h-display text-3xl sm:text-4xl text-zinc-900 dark:text-white">
              Bienvenido, <span className="text-gradient">{user?.nombre}</span> 👋
            </h1>
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-ink-200/80 max-w-xl">
              {rolLabel[user?.rol ?? ''] || user?.rol} · Gestiona tu equipo, nómina y novedades desde un solo lugar.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-zinc-200 text-xs text-zinc-700 dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-ink-200">
              <Calendar className="h-3.5 w-3.5 text-zinc-900 dark:text-violet-300" />
              {new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date())}
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPIs (con stagger) */}
      <Stagger
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        staggerChildren={0.08}
        delayChildren={0.1}
      >
        <KpiCard
          title="Empleados activos"
          value={data?.empleadosActivos ?? 0}
          rawNumber={data?.empleadosActivos ?? 0}
          loading={isLoading}
          subtitle={isLoading ? 'Cargando…' : `Total: ${data?.totalEmpleados ?? 0}`}
          icon={Users}
          accent="violet"
        />
        <KpiCard
          title="Nómina del mes"
          value={formatCOP(data?.nominaDelMes)}
          rawNumber={Number(data?.nominaDelMes ?? 0)}
          format={(n) => formatCOP(n)}
          loading={isLoading}
          subtitle={data?.ultimoPeriodo ? data.ultimoPeriodo.nombre : 'Sin períodos'}
          icon={DollarSign}
          accent="fuchsia"
        />
        <KpiCard
          title="Novedades pendientes"
          value={data?.novedadesPendientes ?? 0}
          rawNumber={data?.novedadesPendientes ?? 0}
          loading={isLoading}
          subtitle={data?.novedadesPendientes ? 'Requieren aprobación' : 'Todo al día'}
          icon={Clock}
          accent="amber"
        />
        <KpiCard
          title="Crecimiento"
          value={`${(data?.crecimientoEmpleados ?? 0).toFixed(1)}%`}
          rawNumber={data?.crecimientoEmpleados ?? 0}
          format={(n) => `${n.toFixed(1)}%`}
          loading={isLoading}
          subtitle="Empleados vs mes anterior"
          icon={TrendingUp}
          trend={data?.crecimientoEmpleados}
          accent="cyan"
        />
      </Stagger>

      {/* Lower row */}
      <Stagger
        className="grid gap-6 lg:grid-cols-3"
        staggerChildren={0.08}
        delayChildren={0.3}
      >
        {/* Estructura */}
        <StaggerItem className="lg:col-span-1">
          <div className="rounded-2xl bg-white border border-zinc-200/80 shadow-sm p-6 dark:bg-ink-800/40 dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-card-dark h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="section-eyebrow">Estructura</span>
                <h2 className="mt-1 h-display text-lg text-zinc-900 dark:text-white">Resumen de la empresa</h2>
              </div>
              <div className="h-9 w-9 rounded-xl bg-zinc-100 border border-zinc-200 dark:bg-violet-500/15 dark:border-violet-400/20 flex items-center justify-center">
                <Activity className="h-4 w-4 text-zinc-900 dark:text-violet-300" />
              </div>
            </div>
            <div className="space-y-3">
              <StatRow label="Áreas" value={data?.totalAreas ?? 0} icon={Building2} accent="violet" />
              <StatRow label="Cargos" value={data?.totalCargos ?? 0} icon={Briefcase} accent="cyan" />
              <StatRow label="Empleados totales" value={data?.totalEmpleados ?? 0} icon={Users} accent="fuchsia" />
            </div>
          </div>
        </StaggerItem>

        {/* Actividad */}
        <StaggerItem className="lg:col-span-2">
          <div className="rounded-2xl bg-white border border-zinc-200/80 shadow-sm p-6 dark:bg-ink-800/40 dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-card-dark h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="section-eyebrow">Actividad</span>
                <h2 className="mt-1 h-display text-lg text-zinc-900 dark:text-white">Novedades recientes</h2>
              </div>
              <Badge tone="brand" dot>en vivo</Badge>
            </div>

            <div className="space-y-2">
              {novedadesQ.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))
              ) : (novedadesQ.data?.items ?? []).length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No hay novedades aún.</p>
              ) : (
                (novedadesQ.data?.items ?? []).slice(0, 5).map((n, idx) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05, duration: 0.3 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-brand text-white text-[11px] font-bold flex items-center justify-center h-display ring-2 ring-white dark:ring-ink-900">
                      {n.empleado ? `${n.empleado.nombre[0]}${n.empleado.apellido[0]}` : '·'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-900 dark:text-ink-100 truncate">
                        <span className="font-medium">
                          {n.empleado ? `${n.empleado.nombre} ${n.empleado.apellido}` : 'Empleado'}
                        </span>
                        <span className="text-muted-foreground"> · {tipoLabel[n.tipo] || n.tipo}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(n.fechaInicio)}</p>
                    </div>
                    <Badge tone={(tipoColor[n.tipo] ?? 'default') as any}>{n.estado}</Badge>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </StaggerItem>
      </Stagger>
    </div>
  );
}

function StatRow({
  label, value, icon: Icon, accent,
}: {
  label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent: 'violet' | 'cyan' | 'fuchsia';
}) {
  const accentClass = {
    violet:  'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-400/20',
    cyan:    'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-400/20',
    fuchsia: 'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:border-fuchsia-400/20',
  }[accent];
  return (
    <motion.div
      whileHover={{ x: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/70 border border-zinc-100 hover:bg-zinc-50 transition-colors dark:bg-white/[0.02] dark:border-white/[0.04] dark:hover:bg-white/[0.04]"
    >
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${accentClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-zinc-700 dark:text-ink-200">{label}</span>
      </div>
      <span className="h-display text-2xl text-zinc-900 dark:text-white tracking-tight2 tabular-nums">
        <AnimatedCounter value={value} />
      </span>
    </motion.div>
  );
}
