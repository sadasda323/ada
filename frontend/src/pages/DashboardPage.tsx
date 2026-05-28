import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bell, ChevronDown, ExternalLink, MoreVertical,
  Star, Users, DollarSign, Target, Calendar,
  TrendingUp, ChevronRight, AlertTriangle,
} from 'lucide-react';

import { dashboardApi, novedadesApi } from '@/services/api.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatCOP, initials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import { Stagger, StaggerItem } from '@/components/ui/motion';

import {
  AnimatedNumber,
  ArcGauge,
  MiniBarChart,
  MiniCandleChart,
} from '@/components/charts';
import { SalesAnalyticsChart } from '@/components/charts/SalesAnalyticsChart';
import { TopProductsHeatmap } from '@/components/charts/TopProductsHeatmap';

const rolLabel: Record<string, string> = {
  ADMIN_EMPRESA: 'Administrador',
  RRHH: 'Recursos Humanos',
  CONTADOR: 'Contador',
  EMPLEADO: 'Empleado',
};

/* ─── Datos demo / derivados ────────────────────────────────────────────── */

const revenueBars = [42, 55, 38, 60, 48, 70, 52, 80, 58, 90, 75, 95];
const ordersCandles = [
  { o: 35, c: 50, h: 55, l: 30 },
  { o: 50, c: 42, h: 58, l: 38 },
  { o: 42, c: 60, h: 65, l: 40 },
  { o: 60, c: 55, h: 68, l: 50 },
  { o: 55, c: 70, h: 75, l: 52 },
  { o: 70, c: 65, h: 78, l: 60 },
  { o: 65, c: 82, h: 88, l: 62 },
  { o: 82, c: 78, h: 90, l: 72 },
  { o: 78, c: 92, h: 95, l: 75 },
];

const salesAnalyticsData = [
  { label: '10 abr', value: 1820, amount: 2120 },
  { label: '11 abr', value: 2950, amount: 3210 },
  { label: '12 abr', value: 2410, amount: 2680 },
  { label: '13 abr', value: 3320, amount: 3580 },
  { label: '14 abr', value: 2890, amount: 3150 },
  { label: '15 abr', value: 3760, amount: 4020 },
  { label: '16 abr', value: 3490, amount: 3820 },
];

const topRows = ['TI', 'Operaciones', 'RRHH', 'Comercial', 'Finanzas', 'Soporte'];
const topCols = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const topMatrix = [
  [0.9, 0.7, 0.85, 0.6, 0.95, 0.3, 0.1],
  [0.6, 0.8, 0.55, 0.9, 0.7, 0.4, 0.2],
  [0.4, 0.6, 0.45, 0.5, 0.65, 0.3, 0.15],
  [0.7, 0.5, 0.75, 0.85, 0.6, 0.5, 0.3],
  [0.5, 0.7, 0.6, 0.55, 0.8, 0.25, 0.1],
  [0.3, 0.5, 0.4, 0.6, 0.5, 0.35, 0.2],
];

const reviews = [
  {
    id: 'r1',
    nombre: 'Kevin S.',
    fecha: 'hace 5 min',
    rating: 5,
    comentario:
      'Súper rápido el cierre de nómina y muy preciso. La nueva vista hace todo más fácil.',
    color: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'r2',
    nombre: 'Rina T.',
    fecha: 'hace 12 min',
    rating: 5,
    comentario:
      'Excelente seguimiento de horas extra. El equipo de RRHH lo agradeció mucho.',
    color: 'bg-emerald-100 text-emerald-700',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * DashboardPage — Yann UIUX inspired, adaptado a HRCO
 * ═══════════════════════════════════════════════════════════════════════════ */

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

  const totalRevenue = Number(data?.nominaDelMes ?? 0);
  const totalOrders = data?.totalEmpleados ?? 0;
  const monthlyTarget = 1000;
  const monthlyAchieved = data?.empleadosActivos ?? 0;
  const monthlyPct = monthlyTarget > 0 ? (monthlyAchieved / monthlyTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="h-display text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight2">
            Resumen general
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user ? `Hola, ${user.nombre}.` : 'Hola.'} Así está rindiendo tu organización hoy.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-zinc-200 text-xs text-zinc-700 dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-ink-200">
          <Calendar className="h-3.5 w-3.5 text-zinc-900 dark:text-violet-300" />
          {new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date())}
        </div>
      </motion.div>

      {/* KPI cards */}
      <Stagger
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        staggerChildren={0.08}
        delayChildren={0.1}
      >
        {/* 1. Total Revenue → Nómina del mes */}
        <KpiCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Nómina del mes"
          loading={isLoading}
          value={
            <AnimatedNumber
              value={totalRevenue}
              format={(n) => formatCOP(n)}
            />
          }
          delta={4.2}
          deltaText="vs. mes anterior"
          chart={<MiniBarChart data={revenueBars} className="h-12 w-32" width={130} height={48} />}
        />

        {/* 2. Total Orders → Empleados totales */}
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          label="Empleados totales"
          loading={isLoading}
          value={<AnimatedNumber value={totalOrders} />}
          delta={4.0}
          deltaText="vs. mes anterior"
          chart={<MiniCandleChart data={ordersCandles} className="h-12 w-32" width={130} height={48} />}
        />

        {/* 3. Monthly Goals → Meta mensual de activos */}
        <div className="rounded-2xl bg-white border border-zinc-200/80 shadow-sm p-5 relative overflow-hidden dark:bg-ink-800/40 dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-card-dark">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-zinc-100 border border-zinc-200 dark:bg-violet-500/15 dark:border-violet-400/20 flex items-center justify-center text-zinc-900 dark:text-violet-300">
                <Target className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-zinc-900 dark:text-ink-100">
                Meta mensual
              </span>
            </div>
            <button
              type="button"
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
              aria-label="Más opciones"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="space-y-2 mt-2">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Objetivo
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-ink-100 tabular-nums">
                  {monthlyTarget.toLocaleString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Logrado
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-ink-100 tabular-nums">
                  {monthlyAchieved.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
            <ArcGauge value={monthlyPct} size={130} thickness={14} />
          </div>
        </div>
      </Stagger>

      {/* Sales Analytics + Top Products */}
      <Stagger
        className="grid gap-4 lg:grid-cols-3"
        staggerChildren={0.1}
        delayChildren={0.3}
      >
        <StaggerItem className="lg:col-span-2">
          <SalesAnalyticsChart
            title="Ventas / nómina diaria"
            scopeLabel="Ventas diarias"
            rangeLabel="10–16 abr 2026"
            data={salesAnalyticsData}
          />
        </StaggerItem>

        <StaggerItem className="lg:col-span-1">
          <TopProductsHeatmap
            title="Actividad por área"
            scopeLabel="Esta semana"
            rows={topRows}
            cols={topCols}
            matrix={topMatrix}
          />
        </StaggerItem>
      </Stagger>

      {/* Budget + Reviews + Low Stock */}
      <Stagger
        className="grid gap-4 lg:grid-cols-3"
        staggerChildren={0.08}
        delayChildren={0.5}
      >
        {/* Budget Usage → Distribución de nómina */}
        <StaggerItem>
          <div className="rounded-2xl bg-white border border-zinc-200/80 shadow-sm p-5 h-full dark:bg-ink-800/40 dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-card-dark">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-ink-100 h-display">
                Distribución de nómina
              </h3>
              <button
                type="button"
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                aria-label="Abrir"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <BudgetBar
                label="Salarios base"
                current={76700000}
                total={120000000}
                index={0}
              />
              <BudgetBar
                label="Horas extra + novedades"
                current={17950000}
                total={25000000}
                index={1}
              />
            </div>

            <div className="mt-5 flex items-start gap-2 p-3 rounded-xl bg-violet-50 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-400/15">
              <div className="h-6 w-6 rounded-md bg-gradient-brand flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              <p className="text-xs text-zinc-700 dark:text-ink-200 leading-relaxed">
                Las horas extra usan <strong>72% del presupuesto.</strong> Reasigna al área de Operaciones para mejorar productividad <strong>+18%</strong> este mes.
              </p>
            </div>
          </div>
        </StaggerItem>

        {/* Customer Review → Aprobaciones recientes */}
        <StaggerItem>
          <div className="rounded-2xl bg-white border border-zinc-200/80 shadow-sm p-5 h-full dark:bg-ink-800/40 dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-card-dark">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-ink-100 h-display">
                Reseñas del equipo
              </h3>
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border bg-white border-zinc-200 text-xs text-zinc-700 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-ink-200">
                Recientes <ChevronDown className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="space-y-4">
              {reviews.map((r, idx) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.08, duration: 0.3 }}
                  className="flex items-start gap-3"
                >
                  <Avatar size="sm" className={cn('shrink-0', r.color)}>
                    <AvatarFallback className={r.color}>
                      {r.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-ink-100">
                        {r.nombre}
                      </p>
                      <Stars value={r.rating} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.fecha}</p>
                    <p className="text-xs text-zinc-700 dark:text-ink-200 mt-1.5 leading-relaxed">
                      "{r.comentario}"
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* Low Stock Alert → Próximos vencimientos */}
        <StaggerItem>
          <div className="rounded-2xl bg-white border border-zinc-200/80 shadow-sm p-5 h-full flex flex-col dark:bg-ink-800/40 dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-card-dark">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-ink-100 h-display">
                Alertas de vencimiento
              </h3>
              <button
                type="button"
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                aria-label="Abrir"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-start gap-3 mb-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-glow-violet">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-ink-100 truncate">
                  Contratos por vencer
                </p>
                <p className="text-xs text-muted-foreground">
                  {(novedadesQ.data?.items?.length ?? 0)} en los próximos 30 días
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-700 dark:text-ink-200 leading-relaxed mb-4 flex-1">
              Hay contratos a término fijo próximos a vencer. Considera renovarlos o
              iniciar el proceso de desvinculación con anticipación.
            </p>

            <Button className="w-full justify-center group">
              Ver vencimientos
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </StaggerItem>
      </Stagger>
    </div>
  );
}

/* ─── Subcomponentes ────────────────────────────────────────────────────── */

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  delta: number;
  deltaText?: string;
  chart: React.ReactNode;
  loading?: boolean;
}

function KpiCard({ icon, label, value, delta, deltaText, chart, loading }: KpiCardProps) {
  const positive = delta >= 0;

  return (
    <StaggerItem>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="rounded-2xl bg-white border border-zinc-200/80 shadow-sm p-5 relative overflow-hidden dark:bg-ink-800/40 dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-card-dark"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-zinc-100 border border-zinc-200 dark:bg-violet-500/15 dark:border-violet-400/20 flex items-center justify-center text-zinc-900 dark:text-violet-300">
              {icon}
            </div>
            <span className="text-sm font-medium text-zinc-900 dark:text-ink-100">{label}</span>
          </div>
          <button
            type="button"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
            aria-label="Más opciones"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="h-display text-3xl font-bold text-zinc-900 dark:text-white tracking-tight2">
              {loading ? <Skeleton className="h-9 w-32" /> : value}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md',
                  positive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
                )}
              >
                <TrendingUp
                  className={cn('h-3 w-3', !positive && 'rotate-180')}
                />
                {Math.abs(delta).toFixed(1)}%
              </span>
              {deltaText && (
                <span className="text-[11px] text-muted-foreground">{deltaText}</span>
              )}
            </div>
          </div>
          <div className="shrink-0">{chart}</div>
        </div>
      </motion.div>
    </StaggerItem>
  );
}

interface BudgetBarProps {
  label: string;
  current: number;
  total: number;
  index: number;
}

function BudgetBar({ label, current, total, index }: BudgetBarProps) {
  const pct = Math.min((current / total) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-zinc-700 dark:text-ink-200 font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {formatCOP(current)} <span className="text-zinc-400 dark:text-ink-400">/ {formatCOP(total)}</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.6 + index * 0.15,
          }}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-brand"
          style={{ filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.5))' }}
        />
      </div>
      <div className="mt-1 text-right">
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {pct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="inline-flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < value
              ? 'fill-amber-400 text-amber-400'
              : 'text-zinc-300 dark:text-ink-400',
          )}
        />
      ))}
    </div>
  );
}
