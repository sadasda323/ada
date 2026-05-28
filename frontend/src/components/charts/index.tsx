import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
 * MiniBarChart — bars verticales con "active bar" resaltada
 * ═══════════════════════════════════════════════════════════════════════════ */

interface MiniBarChartProps {
  data: number[];
  activeIndex?: number;
  className?: string;
  width?: number;
  height?: number;
  /** Índice + 1 (1-based) — el primer bar visible es 1 */
  bars?: number;
}

export function MiniBarChart({
  data,
  activeIndex,
  className,
  width = 120,
  height = 50,
  bars = data.length,
}: MiniBarChartProps) {
  const max = Math.max(...data, 1);
  const slice = data.slice(0, bars);
  const gap = 3;
  const barWidth = (width - gap * (slice.length - 1)) / slice.length;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      {slice.map((v, i) => {
        const h = Math.max((v / max) * height, 2);
        const x = i * (barWidth + gap);
        const y = height - h;
        const isActive = i === (activeIndex ?? slice.length - 2);

        return (
          <motion.rect
            key={i}
            x={x}
            y={height}
            width={barWidth}
            height={0}
            rx={1.5}
            ry={1.5}
            initial={{ y: height, height: 0 }}
            animate={{ y, height: h }}
            transition={{
              duration: 0.6,
              delay: i * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              isActive
                ? 'fill-violet-600 dark:fill-violet-400'
                : 'fill-zinc-300 dark:fill-white/[0.10]',
            )}
            style={
              isActive
                ? { filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.5))' }
                : undefined
            }
          />
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * MiniCandleChart — candlestick OHLC mini
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface Candle {
  o: number; h: number; l: number; c: number;
}

interface MiniCandleChartProps {
  data: Candle[];
  className?: string;
  width?: number;
  height?: number;
  activeIndex?: number;
}

export function MiniCandleChart({
  data,
  className,
  width = 120,
  height = 50,
  activeIndex,
}: MiniCandleChartProps) {
  if (!data.length) return null;
  const allValues = data.flatMap((d) => [d.h, d.l]);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const gap = 3;
  const cw = (width - gap * (data.length - 1)) / data.length;

  const yFor = (v: number) => height - ((v - min) / range) * height;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      {data.map((d, i) => {
        const cx = i * (cw + gap) + cw / 2;
        const x = i * (cw + gap);
        const top = yFor(Math.max(d.o, d.c));
        const bot = yFor(Math.min(d.o, d.c));
        const bullish = d.c >= d.o;
        const isActive = i === (activeIndex ?? data.length - 2);

        const colorActive = 'fill-violet-600 stroke-violet-600 dark:fill-violet-400 dark:stroke-violet-400';
        const colorIdle = 'fill-zinc-300 stroke-zinc-300 dark:fill-white/[0.12] dark:stroke-white/[0.18]';

        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className={isActive ? colorActive : colorIdle}
            style={
              isActive
                ? { filter: 'drop-shadow(0 0 5px rgba(139,92,246,0.45))' }
                : undefined
            }
          >
            {/* wick */}
            <line
              x1={cx} y1={yFor(d.h)}
              x2={cx} y2={yFor(d.l)}
              strokeWidth={1}
            />
            {/* body */}
            <rect
              x={x}
              y={top}
              width={cw}
              height={Math.max(bot - top, 1.5)}
              rx={1}
              ry={1}
              fillOpacity={bullish ? 1 : 0.5}
            />
          </motion.g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ArcGauge — semicircular gauge animado de 0% al value
 * ═══════════════════════════════════════════════════════════════════════════ */

interface ArcGaugeProps {
  value: number;            // 0-100
  size?: number;
  thickness?: number;
  className?: string;
  showLabel?: boolean;
}

export function ArcGauge({
  value,
  size = 120,
  thickness = 14,
  className,
  showLabel = true,
}: ArcGaugeProps) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2 + 8; // un poco abajo
  const startAngle = Math.PI;          // 180°
  const endAngle = 2 * Math.PI;        // 360°
  const totalArc = endAngle - startAngle;
  const pct = Math.min(Math.max(value, 0), 100) / 100;

  const polar = (a: number) => ({
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  });

  const pStart = polar(startAngle);
  const pEnd = polar(endAngle);

  // Arco completo (track)
  const trackPath = [
    `M ${pStart.x} ${pStart.y}`,
    `A ${r} ${r} 0 0 1 ${pEnd.x} ${pEnd.y}`,
  ].join(' ');

  // Length total del arco (semicírculo)
  const arcLen = Math.PI * r;

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg
        width={size}
        height={size / 2 + 24}
        viewBox={`0 0 ${size} ${size / 2 + 24}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#D946EF" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          className="stroke-zinc-200 dark:stroke-white/[0.08]"
        />

        {/* Progress arc */}
        <motion.path
          d={trackPath}
          fill="none"
          stroke="url(#arc-grad)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={arcLen}
          initial={{ strokeDashoffset: arcLen }}
          animate={{ strokeDashoffset: arcLen * (1 - pct) }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.45))' }}
        />
      </svg>

      {showLabel && (
        <div className="absolute inset-0 flex items-end justify-center pb-1.5">
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums h-display"
          >
            <AnimatedNumber value={Math.round(value)} suffix="%" />
          </motion.span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SparkLine — línea simple con gradient fill
 * ═══════════════════════════════════════════════════════════════════════════ */

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  fillId?: string;
}

export function SparkLine({
  data,
  width = 120,
  height = 40,
  className,
  color = '#8B5CF6',
  fillId = 'spark-fill',
}: SparkLineProps) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.1;
    return [x, y] as const;
  });

  // smooth path con catmull-rom → bezier
  const path = catmullRom2bezier(points);
  const area = `${path} L ${points[points.length - 1][0]} ${height} L ${points[0][0]} ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#${fillId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
      />
    </svg>
  );
}

/* ─── helper para path suave (catmull-rom → cubic bezier) ───────────────── */

function catmullRom2bezier(pts: ReadonlyArray<readonly [number, number]>) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.16;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * AnimatedNumber — count-up genérico con sufijo opcional
 * ═══════════════════════════════════════════════════════════════════════════ */

import * as React from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useReducedMotionSafe } from '@/components/ui/motion';

export function AnimatedNumber({
  value,
  format,
  suffix,
  prefix,
  duration = 1.2,
}: {
  value: number;
  format?: (n: number) => string;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const reduced = useReducedMotionSafe();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, {
    stiffness: 60,
    damping: 18,
    duration: duration * 1000,
  });
  const display = useTransform(spring, (v) =>
    format ? format(v) : Math.round(v).toLocaleString('es-CO'),
  );
  const [text, setText] = React.useState(format ? format(reduced ? value : 0) : '0');

  React.useEffect(() => {
    if (reduced) {
      setText(format ? format(value) : Math.round(value).toLocaleString('es-CO'));
      return;
    }
    mv.set(value);
    const unsub = display.on('change', (v: string) => setText(v));
    return unsub;
  }, [value, mv, display, reduced, format]);

  return (
    <span className="tabular-nums">
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
