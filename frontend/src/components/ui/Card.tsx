import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card shadcn-style + spotlight hover opcional.
 *
 * Uso "interactivo":
 *   <Card interactive> → activa lift + spotlight cursor
 */
export interface CardProps extends React.ComponentProps<'div'> {
  interactive?: boolean;
}

function Card({ className, interactive, onMouseMove, ...props }: CardProps) {
  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (interactive) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      e.currentTarget.style.setProperty('--spotlight-x', `${x}px`);
      e.currentTarget.style.setProperty('--spotlight-y', `${y}px`);
    }
    onMouseMove?.(e);
  };

  return (
    <div
      data-slot="card"
      data-interactive={interactive ? '' : undefined}
      onMouseMove={handleMouseMove}
      className={cn(
        'relative flex flex-col rounded-2xl overflow-hidden',
        'bg-card text-card-foreground border border-zinc-200/80 shadow-sm',
        'dark:bg-ink-800/40 dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-card-dark',
        'transition-all duration-300',
        interactive &&
          'card-spotlight hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-elevated-dark',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-white/[0.06]',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        'text-base font-semibold leading-none text-zinc-900 dark:text-ink-100 h-display',
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-description"
      className={cn('mt-0.5 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('ml-auto', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('p-6', className)}
      {...props}
    />
  );
}

/** Alias de CardContent para compatibilidad con la API previa de HRCO. */
const CardBody = CardContent;

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 dark:border-white/[0.06] dark:bg-white/[0.02]',
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardBody,
  CardFooter,
};
