import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Button shadcn-style con CVA.
 *
 * Variants:
 *   default      → CTA primario (bg-gradient-brand violet→fuchsia)
 *   destructive  → rojo
 *   outline      → contorno
 *   secondary    → fondo gris claro
 *   ghost        → solo hover
 *   link         → enlace
 *
 * Sizes: xs | sm | default | lg | icon | icon-sm | icon-lg
 *
 * Compat aliases (API legacy del proyecto HRCO):
 *   variant='primary' === 'default'
 *   variant='danger'  === 'destructive'
 *
 * Props extra:
 *   loading?: boolean → muestra spinner y deshabilita
 *   asChild?: boolean → renderiza el children como Slot (Radix)
 */
export const buttonVariants = cva(
  cn(
    'relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:opacity-50 disabled:pointer-events-none',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    'active:scale-[0.97]',
  ),
  {
    variants: {
      variant: {
        default:
          'text-white bg-gradient-brand shadow-glow-violet hover:shadow-glow-fuchsia hover:brightness-110',
        destructive:
          'text-white bg-gradient-to-br from-rose-500 to-fuchsia-600 shadow-glow-fuchsia hover:brightness-110',
        outline:
          'text-zinc-700 border border-zinc-300 bg-white hover:bg-zinc-50 hover:border-zinc-400 dark:text-ink-100 dark:border-white/[0.10] dark:bg-transparent dark:hover:bg-white/[0.04] dark:hover:border-white/[0.20]',
        secondary:
          'text-zinc-900 bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 dark:text-ink-100 dark:bg-white/[0.06] dark:border-white/[0.08] dark:hover:bg-white/[0.10]',
        ghost:
          'text-zinc-700 hover:bg-zinc-100 dark:text-ink-200 dark:hover:bg-white/[0.06] dark:hover:text-white',
        link:
          'text-violet-600 underline-offset-4 hover:underline dark:text-violet-300',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-lg',
        sm: 'h-8 px-3 text-xs rounded-lg',
        default: 'h-10 px-4 text-sm rounded-xl',
        lg: 'h-12 px-6 text-base rounded-xl',
        icon: 'h-10 w-10 rounded-xl',
        'icon-sm': 'h-8 w-8 rounded-lg',
        'icon-lg': 'h-12 w-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

/** API extendida con compat legacy (`primary`, `danger`, `md`) */
export type ButtonVariant =
  | NonNullable<ButtonVariants['variant']>
  | 'primary'
  | 'danger';
export type ButtonSize = NonNullable<ButtonVariants['size']> | 'md';

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
}

function normalizeVariant(v: ButtonVariant | undefined): ButtonVariants['variant'] {
  if (v === 'primary') return 'default';
  if (v === 'danger') return 'destructive';
  return v;
}
function normalizeSize(s: ButtonSize | undefined): ButtonVariants['size'] {
  if (s === 'md') return 'default';
  return s;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot.Root : 'button';
    const v = normalizeVariant(variant);
    const s = normalizeSize(size);

    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        data-slot="button"
        data-variant={v}
        data-size={s}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant: v, size: s }), className)}
        {...props}
      >
        {loading && !asChild ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
