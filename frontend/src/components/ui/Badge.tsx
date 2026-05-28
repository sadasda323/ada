import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  cn(
    'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden',
    'rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap',
    'border transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ),
  {
    variants: {
      variant: {
        default:
          'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-white/[0.06] dark:text-ink-200 dark:border-white/[0.06]',
        brand:
          'bg-zinc-900 text-white border-zinc-900 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-400/20',
        success:
          'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/20',
        warning:
          'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-400/20',
        danger:
          'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-400/20',
        destructive:
          'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-400/20',
        info:
          'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-400/20',
        cyan:
          'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-400/20',
        outline:
          'bg-transparent text-foreground border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type BadgeVariants = VariantProps<typeof badgeVariants>;
export type BadgeTone = NonNullable<BadgeVariants['variant']>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    BadgeVariants {
  /** Compat legacy: `tone` mapea a `variant`. */
  tone?: BadgeTone;
  /** Punto pulsante a la izquierda. */
  dot?: boolean;
  asChild?: boolean;
}

export function Badge({
  className,
  variant,
  tone,
  dot,
  asChild,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : 'span';
  const v = (variant ?? tone ?? 'default') as BadgeTone;

  return (
    <Comp
      data-slot="badge"
      data-variant={v}
      className={cn(badgeVariants({ variant: v }), className)}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-current opacity-60 animate-ping" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </Comp>
  );
}
