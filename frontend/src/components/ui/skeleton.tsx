import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton shadcn-style.
 * Por defecto usa el shimmer custom del proyecto (clase `.skeleton` en index.css).
 * Pasa `pulse` si prefieres el animate-pulse estándar de shadcn.
 */
export function Skeleton({
  className,
  pulse,
  ...props
}: React.ComponentProps<'div'> & { pulse?: boolean }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        pulse ? 'animate-pulse rounded-md bg-muted' : 'skeleton',
        className,
      )}
      {...props}
    />
  );
}
