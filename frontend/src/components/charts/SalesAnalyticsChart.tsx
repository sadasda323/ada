import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
 * SalesAnalyticsChart — line chart con tooltip que sigue al cursor
 *
 * Replica el chart "Sales Analytics" del video Yann UIUX:
 *   - Curva suave con gradient fill
 *   - Path drawing animation al montar (1.4s)
 *   - Tooltip flotante "<value> sales / $<amount>"
 *   - Crosshair vertical
 *   - Glow azul en dark mode
 * ═══════════════════════════════════════════════════════════════════════════ */

interface DataPoint {
  label: string;        // "10 April"
  value: number;        // métrica primaria (sales)
  amount?: number;      // métrica secundaria (ingresos)
}

interface Props {
  title?: string;
  subtitle?: string;
  data: DataPoint[];
  className?: string;
  rangeLabel?: string;
  scopeLabel?: string;
  /** Si está activo, el tooltip recorre la curva automáticamente cada `tourInterval` segundos. */
  autoTour?: boolean;
  tourInterval?: number;
}

export function SalesAnalyticsChart({
  title = 'Sales Analytics',
  data,
  className,
  rangeLabel = '10–15 April 2026',
  scopeLabel = 'Daily Sales',
  autoTour = true,
  tourInterval = 2.4,
}: Props) {
  const W = 720;
  const H = 220;
  const padX = 28;
  const padTop = 16;
  const padBottom = 28;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * innerW;
    const y = padTop + innerH - ((d.value - min) / range) * innerH * 0.9 - innerH * 0.05;
    return { x, y, ...d };
  });

  const linePath = catmullRom2bezier(points.map((p) => [p.x, p.y] as const));
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + innerH} L ${points[0].x} ${padTop + innerH} Z`;

  const yTicks = 5;
  const ticks = Array.from({ length: yTicks }, (_, i) => {
    const v = min + ((max - min) / (yTicks - 1)) * (yTicks - 1 - i);
    return Math.round(v / 100) * 100;
  });

  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [tourIdx, setTourIdx] = React.useState(0);
  const [isHovering, setIsHovering] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);

  // Auto-tour: recorre los puntos de la curva cíclicamente cuando no se hace hover
  React.useEffect(() => {
    if (!autoTour || isHovering) return;
    const id = setInterval(() => {
      setTourIdx((i) => (i + 1) % data.length);
    }, tourInterval * 1000);
    return () => clearInterval(id);
  }, [autoTour, isHovering, data.length, tourInterval]);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsHovering(true);
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHoverIdx(best);
  };

  const handleLeave = () => {
    setIsHovering(false);
    setHoverIdx(null);
  };

  const activeIdx = hoverIdx ?? (autoTour ? tourIdx : null);
  const active = activeIdx !== null ? points[activeIdx] : null;

  return (
    <div
      className={cn(
        'rounded-2xl bg-white border border-zinc-200/80 shadow-sm overflow-hidden',
        'dark:bg-ink-800/40 dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-card-dark',
        className,
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-ink-100 h-display">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Pill>
            {scopeLabel} <ChevronDown className="h-3.5 w-3.5" />
          </Pill>
          <Pill>
            <Calendar className="h-3.5 w-3.5" /> {rangeLabel}
          </Pill>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors dark:text-ink-300 dark:hover:text-white dark:hover:bg-white/[0.06]"
            aria-label="Abrir"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative px-2 pb-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-[220px] cursor-crosshair"
          preserveAspectRatio="none"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          aria-label={title}
        >
          <defs>
            <linearGradient id="sales-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="sales-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#D946EF" />
            </linearGradient>
          </defs>

          {/* Y-axis ticks (texto) */}
          {ticks.map((t, i) => {
            const y = padTop + (i / (yTicks - 1)) * innerH;
            return (
              <g key={i}>
                <line
                  x1={padX}
                  x2={W - padX}
                  y1={y}
                  y2={y}
                  className="stroke-zinc-100 dark:stroke-white/[0.04]"
                  strokeDasharray="2 4"
                />
                <text
                  x={padX - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-zinc-400 dark:fill-ink-400 text-[10px]"
                >
                  {t.toLocaleString('es-CO')}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={H - 8}
              textAnchor="middle"
              className="fill-zinc-400 dark:fill-ink-400 text-[10px]"
            >
              {p.label}
            </text>
          ))}

          {/* Area */}
          <motion.path
            d={areaPath}
            fill="url(#sales-area)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          />

          {/* Line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="url(#sales-line)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.35))' }}
          />

          {/* Hover/tour crosshair + dot + tooltip */}
          {active && (
            <motion.g
              initial={false}
              animate={{ x: active.x }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            >
              <line
                x1={0}
                x2={0}
                y1={padTop}
                y2={padTop + innerH}
                strokeDasharray="3 3"
                className="stroke-zinc-300 dark:stroke-white/[0.18]"
              />
            </motion.g>
          )}
          {active && (
            <motion.circle
              initial={false}
              animate={{ cx: active.x, cy: active.y }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              r={6}
              className="fill-white dark:fill-ink-900 stroke-violet-500 dark:stroke-violet-400"
              strokeWidth={2.5}
              style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.6))' }}
            />
          )}
          {active && (
            <ChartTooltip x={active.x} y={active.y} value={active.value} amount={active.amount} />
          )}
        </svg>
      </div>
    </div>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border',
        'bg-white border-zinc-200 text-zinc-700',
        'dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-ink-200',
        className,
      )}
    >
      {children}
    </span>
  );
}

function ChartTooltip({
  x, y, value, amount,
}: { x: number; y: number; value: number; amount?: number }) {
  // Tooltip dimensions y posicionamiento auto-flip
  const w = 86;
  const h = 38;
  const tx = Math.min(Math.max(x - w / 2, 4), 720 - w - 4);
  const ty = Math.max(y - h - 12, 8);

  return (
    <motion.g
      initial={false}
      animate={{ x: tx, y: ty, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
    >
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        rx={8}
        className="fill-zinc-900 dark:fill-ink-800"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' }}
      />
      <text
        x={w / 2}
        y={15}
        textAnchor="middle"
        className="fill-white text-[10px] font-medium"
      >
        {value.toLocaleString('es-CO')} ventas
      </text>
      {amount !== undefined && (
        <text
          x={w / 2}
          y={28}
          textAnchor="middle"
          className="fill-violet-300 text-[10px] font-semibold tabular-nums"
        >
          ${amount.toLocaleString('es-CO')}
        </text>
      )}
    </motion.g>
  );
}

/* ─── helper para path suave ────────────────────────────────────────────── */

function catmullRom2bezier(pts: ReadonlyArray<readonly [number, number]>) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}
