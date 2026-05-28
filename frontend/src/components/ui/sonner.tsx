import {
  CheckCircle2,
  Info,
  Loader2,
  OctagonX,
  TriangleAlert,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { useThemeStore } from '@/stores/theme.store';

/**
 * Sonner Toaster shadcn-style integrado con el theme.store del proyecto.
 * Reemplaza el Toaster de react-hot-toast manteniendo `toast.success` / `toast.error`
 * vía el adapter en `lib/toast.ts`.
 */
export function Toaster(props: ToasterProps) {
  const theme = useThemeStore((s) => s.theme);

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      icons={{
        success: <CheckCircle2 className="size-4" />,
        info: <Info className="size-4" />,
        warning: <TriangleAlert className="size-4" />,
        error: <OctagonX className="size-4" />,
        loading: <Loader2 className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast rounded-2xl border bg-white text-zinc-900 shadow-lg ' +
            'dark:bg-ink-800/90 dark:text-ink-100 dark:border-white/[0.08] dark:backdrop-blur-2xl',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
        },
      }}
      style={
        {
          '--normal-bg': 'hsl(var(--popover))',
          '--normal-text': 'hsl(var(--popover-foreground))',
          '--normal-border': 'hsl(var(--border))',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
