import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/theme.store';

/**
 * ThemeToggle pill switch iOS-style.
 * Versión animada del switch del video Yann UIUX:
 *   - Pill horizontal con dos iconos (sol / luna)
 *   - Bola que se mueve con spring entre ambos
 *   - Cross-fade del icono activo
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      onClick={toggle}
      className={cn(
        'relative inline-flex items-center h-7 w-[58px] rounded-full transition-colors',
        'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isDark
          ? 'bg-violet-500/20 border-violet-400/40'
          : 'bg-zinc-200 border-zinc-300',
        className,
      )}
    >
      {/* Iconos de fondo */}
      <span className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
        <Sun
          className={cn(
            'h-3.5 w-3.5 transition-colors',
            isDark ? 'text-zinc-400' : 'text-amber-500',
          )}
        />
        <Moon
          className={cn(
            'h-3.5 w-3.5 transition-colors',
            isDark ? 'text-violet-300' : 'text-zinc-400',
          )}
        />
      </span>

      {/* Bola */}
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={cn(
          'relative z-10 h-5 w-5 rounded-full shadow-sm flex items-center justify-center',
          isDark
            ? 'ml-auto mr-1 bg-gradient-brand'
            : 'ml-1 bg-white',
        )}
      >
        <motion.span
          key={isDark ? 'm' : 's'}
          initial={{ scale: 0.6, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.18 }}
          className="inline-flex"
        >
          {isDark ? (
            <Moon className="h-3 w-3 text-white" />
          ) : (
            <Sun className="h-3 w-3 text-amber-500" />
          )}
        </motion.span>
      </motion.span>
    </button>
  );
}
