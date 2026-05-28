import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/* ═══════════════════════════════════════════════════════════════════════════
 * Primitives shadcn (Table, TableHeader, TableBody, TableRow, TableHead,
 * TableCell, TableFooter, TableCaption)
 * ═══════════════════════════════════════════════════════════════════════════ */

export function TablePrimitive({
  className,
  ...props
}: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        '[&_tr]:border-b [&_tr]:border-zinc-100 dark:[&_tr]:border-white/[0.06]',
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

export function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'border-t bg-zinc-50/50 font-medium dark:bg-white/[0.02] [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b border-zinc-100 transition-colors dark:border-white/[0.04]',
        'hover:bg-zinc-50 dark:hover:bg-white/[0.03]',
        'data-[state=selected]:bg-zinc-100 dark:data-[state=selected]:bg-white/[0.06]',
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-11 px-4 text-left align-middle whitespace-nowrap',
        'text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'px-4 py-3.5 align-middle text-zinc-700 dark:text-ink-200',
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * <Table /> wrapper de alto nivel (API legacy del proyecto HRCO)
 * Acepta `columns/rows/rowKey/loading/emptyText/onRowClick` y aplica stagger.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

const MotionTr = motion.tr;

export function Table<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyText = 'Sin datos',
  onRowClick,
  className,
}: TableProps<T>) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-2xl border bg-white shadow-sm',
        'border-zinc-200/80 dark:bg-ink-800/40 dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-card-dark',
        className,
      )}
    >
      <TablePrimitive className="min-w-[640px]">
        <TableHeader>
          <tr className="border-b border-zinc-100 dark:border-white/[0.06]">
            {columns.map((c) => (
              <TableHead
                key={String(c.key)}
                className={c.className}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.header}
              </TableHead>
            ))}
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-100 dark:border-white/[0.04]">
                {columns.map((c, j) => (
                  <TableCell key={j} className={c.className}>
                    <Skeleton className="h-3 w-3/4" />
                  </TableCell>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <TableCell
                colSpan={columns.length}
                className="px-4 py-14 text-center text-muted-foreground"
              >
                <div className="mx-auto h-10 w-10 rounded-full bg-zinc-100 dark:bg-white/[0.04] flex items-center justify-center mb-3">
                  <span className="text-zinc-400 dark:text-ink-400">∅</span>
                </div>
                {emptyText}
              </TableCell>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <MotionTr
                key={rowKey(row)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  ease: [0.16, 1, 0.3, 1],
                  delay: Math.min(idx * 0.025, 0.4),
                }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-zinc-100 transition-colors dark:border-white/[0.04]',
                  'hover:bg-zinc-50 dark:hover:bg-white/[0.03]',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((c) => (
                  <TableCell
                    key={String(c.key)}
                    className={c.className}
                  >
                    {c.render ? c.render(row) : ((row as any)[c.key] as React.ReactNode)}
                  </TableCell>
                ))}
              </MotionTr>
            ))
          )}
        </TableBody>
      </TablePrimitive>
    </div>
  );
}
