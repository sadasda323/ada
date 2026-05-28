import * as React from 'react';
import { cn } from '@/lib/utils';

/* ── Primitive shadcn-style ────────────────────────────────────────────── */

export const inputClassName = cn(
  'flex h-10 w-full min-w-0 rounded-xl border px-3.5 text-sm transition-colors',
  'bg-white text-zinc-900 placeholder:text-zinc-400 border-zinc-200',
  'focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10',
  'dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-ink-100 dark:placeholder:text-ink-400',
  'dark:focus:bg-white/[0.06] dark:focus:border-violet-400/60 dark:focus:ring-violet-500/20',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'aria-invalid:border-rose-400 aria-invalid:focus:border-rose-400 aria-invalid:focus:ring-rose-500/15',
  'dark:aria-invalid:border-rose-500/50 dark:aria-invalid:focus:ring-rose-500/20',
);

/* ── <Input /> con label, error, hint (API legacy HRCO) ────────────────── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || `f-${props.name}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          data-slot="input"
          className={cn(inputClassName, className)}
          {...props}
        />
        {error ? (
          <p className="field-error">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
