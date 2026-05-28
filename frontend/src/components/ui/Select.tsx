import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { inputClassName } from '@/components/ui/Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

/**
 * Select nativo con estilos shadcn-friendly.
 * Se queda como `<select>` nativo (no Radix) para que react-hook-form
 * `register()` siga funcionando idéntico.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const inputId = id || `s-${props.name}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            data-slot="select"
            className={cn(
              inputClassName,
              'pr-9 appearance-none cursor-pointer',
              'bg-white dark:bg-white/[0.04]',
              className,
            )}
            {...props}
          >
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-ink-400"
          />
        </div>
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';
