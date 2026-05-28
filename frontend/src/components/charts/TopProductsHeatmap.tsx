import { motion } from 'framer-motion';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeatmapProps {
  title?: string;
  /** Filas (productos / categorías). */
  rows: string[];
  /** Columnas (días, semanas, meses…). */
  cols: string[];
  /** Matriz [row][col] con valores 0..1 (intensidad). */
  matrix: number[][];
  className?: string;
  scopeLabel?: string;
}

export function TopProductsHeatmap({
  title = 'Top Products',
  rows,
  cols,
  matrix,
  className,
  scopeLabel = 'Daily Sales',
}: HeatmapProps) {
  const cell = 32;
  const gap = 4;
  const yLabelWidth = 68;
  const xLabelHeight = 22;

  const totalW = yLabelWidth + cols.length * (cell + gap);
  const totalH = xLabelHeight + rows.length * (cell + gap);

  return (
    <div
      className={cn(
        'rounded-2xl bg-white border border-zinc-200/80 shadow-sm overflow-hidden',
        'dark:bg-ink-800/40 dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-card-dark',
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-ink-100 h-display">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border bg-white border-zinc-200 text-zinc-700 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-ink-200">
            {scopeLabel} <ChevronDown className="h-3.5 w-3.5" />
          </span>
          <button
            type="button"
            aria-label="Abrir"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-ink-300 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-5 pb-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          className="w-full h-auto"
          style={{ maxWidth: totalW }}
          preserveAspectRatio="xMidYMid meet"
          aria-label={title}
        >
          {/* Y labels (productos) */}
          {rows.map((r, i) => (
            <text
              key={r}
              x={yLabelWidth - 8}
              y={xLabelHeight + i * (cell + gap) + cell / 2 + 4}
              textAnchor="end"
              className="fill-zinc-500 dark:fill-ink-300 text-[11px]"
            >
              {r}
            </text>
          ))}

          {/* X labels (días) */}
          {cols.map((c, j) => (
            <text
              key={c}
              x={yLabelWidth + j * (cell + gap) + cell / 2}
              y={totalH - 4}
              textAnchor="middle"
              className="fill-zinc-500 dark:fill-ink-300 text-[10px]"
            >
              {c}
            </text>
          ))}

          {/* Cells - stagger por valor (las más altas aparecen primero) */}
          {(() => {
            // Pre-calcular orden de aparición: ordenar índices por valor descendente
            const cells: { i: number; j: number; v: number }[] = [];
            rows.forEach((_, i) =>
              cols.forEach((_, j) => {
                cells.push({ i, j, v: matrix[i]?.[j] ?? 0 });
              }),
            );
            const sorted = [...cells].sort((a, b) => b.v - a.v);
            const orderMap = new Map<string, number>();
            sorted.forEach(({ i, j }, k) => orderMap.set(`${i}-${j}`, k));

            return cells.map(({ i, j, v }) => {
              const x = yLabelWidth + j * (cell + gap);
              const y = xLabelHeight + i * (cell + gap);
              const order = orderMap.get(`${i}-${j}`) ?? 0;

              return (
                <motion.rect
                  key={`${i}-${j}`}
                  x={x}
                  y={y}
                  width={cell}
                  height={cell}
                  rx={6}
                  ry={6}
                  initial={{ opacity: 0, scale: 0.5, y: y + 8 }}
                  animate={{ opacity: 1, scale: 1, y }}
                  transition={{
                    duration: 0.35,
                    delay: 0.02 * order,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={getCellClass(v)}
                  style={
                    v >= 0.65
                      ? { filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.25))' }
                      : undefined
                  }
                />
              );
            });
          })()}
        </svg>
      </div>
    </div>
  );
}

function getCellClass(v: number): string {
  if (v >= 0.85) return 'fill-violet-600 dark:fill-violet-400';
  if (v >= 0.65) return 'fill-violet-500/80 dark:fill-violet-400/80';
  if (v >= 0.45) return 'fill-violet-400/60 dark:fill-violet-400/55';
  if (v >= 0.25) return 'fill-violet-300/50 dark:fill-violet-400/30';
  if (v > 0)     return 'fill-zinc-200 dark:fill-white/[0.10]';
  return 'fill-zinc-100 dark:fill-white/[0.04]';
}
