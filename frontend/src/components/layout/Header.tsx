import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, ChevronDown, LogOut, User as UserIcon,
  Search, Bell, Sun, Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { authApi } from '@/services/auth.service';
import { initials, cn } from '@/lib/utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { inputClassName } from '@/components/ui/Input';

const rolLabel: Record<string, string> = {
  ADMIN_EMPRESA: 'Administrador',
  RRHH: 'Recursos Humanos',
  CONTADOR: 'Contador',
  EMPLEADO: 'Empleado',
};

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const navigate = useNavigate();
  const [hasNotifs] = useState(true);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clear();
    navigate('/login', { replace: true });
  };

  const isDark = theme === 'dark';

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-16 shrink-0 flex items-center px-3 sm:px-4 lg:px-6 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-ink-900/40">
        {/* Izquierda: hamburguesa + search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleSidebar}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors dark:text-ink-300 dark:hover:text-white dark:hover:bg-white/[0.06] active:scale-95 shrink-0"
                aria-label="Alternar menú"
              >
                <Menu className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Menú</TooltipContent>
          </Tooltip>

          {/* Search */}
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.currentTarget.elements.namedItem('global-q') as HTMLInputElement | null)?.value?.trim();
              navigate(q ? `/empleados?q=${encodeURIComponent(q)}` : '/empleados');
            }}
            className="relative w-full max-w-md hidden md:block"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-ink-400 pointer-events-none" />
            <input
              type="text"
              name="global-q"
              placeholder="Buscar empleados, cargos…"
              className={cn(
                inputClassName,
                'pl-9 pr-16 bg-zinc-100/70 border-transparent dark:bg-white/[0.03]',
              )}
            />
            <KbdGroup className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </form>
        </div>

        {/* Derecha: theme + bell + separator + avatar dropdown */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleTheme}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors dark:text-ink-300 dark:hover:text-white dark:hover:bg-white/[0.06] active:scale-95 overflow-hidden shrink-0"
                aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isDark ? 'sun' : 'moon'}
                    initial={{ y: -16, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 16, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="inline-flex"
                  >
                    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </motion.span>
                </AnimatePresence>
              </button>
            </TooltipTrigger>
            <TooltipContent>{isDark ? 'Tema claro' : 'Tema oscuro'}</TooltipContent>
          </Tooltip>

          {/* Notificaciones */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors dark:text-ink-300 dark:hover:text-white dark:hover:bg-white/[0.06] active:scale-95 shrink-0"
                aria-label="Notificaciones"
              >
                <Bell className="h-5 w-5" />
                {hasNotifs && (
                  <>
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-zinc-900 dark:bg-cyan-400 ring-2 ring-white dark:ring-ink-900" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-zinc-900/40 dark:bg-cyan-400/40 animate-ping" />
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>Notificaciones</TooltipContent>
          </Tooltip>

          <Separator
            orientation="vertical"
            className="hidden sm:block mx-1 sm:mx-2 h-6 bg-zinc-200 dark:bg-white/[0.08]"
          />

          {/* User dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 sm:gap-3 group rounded-xl px-1.5 py-1 hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {user && (
                  <div className="hidden sm:flex flex-col items-end leading-tight pr-1">
                    <span className="text-sm font-medium text-zinc-900 dark:text-ink-100 whitespace-nowrap">
                      {user.nombre} {user.apellido}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-violet-300/80 whitespace-nowrap">
                      {rolLabel[user.rol] || user.rol}
                    </span>
                  </div>
                )}
                <span className="relative h-9 w-9 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-gradient-brand blur-sm opacity-40 dark:opacity-60" />
                  <Avatar className="relative ring-2 ring-white dark:ring-ink-900">
                    <AvatarFallback>
                      {user ? initials(user.nombre, user.apellido) : '?'}
                    </AvatarFallback>
                  </Avatar>
                </span>
                <ChevronDown
                  className="h-4 w-4 text-zinc-400 dark:text-ink-400 transition-transform group-data-[state=open]:rotate-180 shrink-0"
                  aria-hidden
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
              <div className="px-3 py-3 bg-gradient-to-br from-zinc-50 to-transparent dark:from-violet-500/10 rounded-xl mb-1.5">
                <p className="text-sm font-semibold text-zinc-900 dark:text-ink-100">
                  {user?.nombre} {user?.apellido}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-700 dark:text-violet-300/90 font-semibold">
                  <span className="h-1 w-1 rounded-full bg-zinc-900 dark:bg-violet-300" />
                  {rolLabel[user?.rol ?? ''] || user?.rol}
                </p>
              </div>

              <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate('/configuracion')}>
                <UserIcon className="size-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut className="size-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
