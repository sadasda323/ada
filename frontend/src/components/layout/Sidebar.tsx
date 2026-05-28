import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Building2,
  DollarSign, BarChart3, Settings, UserCog, FileText,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useReducedMotionSafe } from '@/components/ui/motion';

interface SidebarProps {
  collapsed: boolean;
}

const groups = [
  {
    label: 'Principal',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Personas',
    items: [
      { to: '/empleados', label: 'Empleados', icon: Users },
      { to: '/cargos',    label: 'Cargos',    icon: Briefcase },
      { to: '/areas',     label: 'Áreas',     icon: Building2 },
    ],
  },
  {
    label: 'Operación',
    items: [
      { to: '/nomina',    label: 'Nómina',    icon: DollarSign },
      { to: '/novedades', label: 'Novedades', icon: FileText },
      { to: '/reportes',  label: 'Reportes',  icon: BarChart3 },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/configuracion', label: 'Configuración', icon: Settings },
      { to: '/usuarios',      label: 'Usuarios',      icon: UserCog },
    ],
  },
];

export function Sidebar({ collapsed }: SidebarProps) {
  const reduced = useReducedMotionSafe();

  return (
    <TooltipProvider delayDuration={300}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 68 : 256 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className={cn(
          'h-screen flex flex-col overflow-hidden',
          'bg-white border-r border-zinc-200/80',
          'dark:bg-ink-900/60 dark:backdrop-blur-2xl dark:border-white/[0.06]',
        )}
      >
        {/* Brand */}
        <div className={cn(
          'flex items-center gap-3 h-16 px-4 border-b border-zinc-100 dark:border-white/[0.06] shrink-0',
          collapsed && 'justify-center px-0',
        )}>
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-gradient-brand text-white font-bold text-sm flex items-center justify-center shadow-glow-violet h-display">
              HR
            </div>
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-zinc-900 dark:bg-cyan-400 ring-2 ring-white dark:ring-ink-900 animate-pulse-glow" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="brand-text"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="leading-tight whitespace-nowrap"
              >
                <p className="h-display text-zinc-900 dark:text-white text-base">HRCO</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-violet-300/70 font-semibold">Suite</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 no-scrollbar">
          <motion.ul
            className="space-y-6"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
            }}
            initial={reduced ? false : 'hidden'}
            animate="show"
          >
            {groups.map((group) => (
              <motion.li
                key={group.label}
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
                }}
              >
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.p
                      key="group-label"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="px-2 mb-2 text-[10px] uppercase tracking-[0.18em] text-zinc-400 dark:text-ink-400/80 font-semibold whitespace-nowrap"
                    >
                      {group.label}
                    </motion.p>
                  )}
                </AnimatePresence>

                <ul className="space-y-0.5">
                  {group.items.map(({ to, label, icon: Icon }) => (
                    <li key={to}>
                      <NavItem to={to} label={label} Icon={Icon} collapsed={collapsed} />
                    </li>
                  ))}
                </ul>
              </motion.li>
            ))}
          </motion.ul>
        </nav>

        {/* Footer card */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="footer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="p-3 shrink-0"
            >
              <div className="relative overflow-hidden rounded-2xl p-4 ring-gradient bg-zinc-100 dark:bg-transparent">
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-violet-600/30 dark:via-fuchsia-500/15 dark:to-cyan-500/10 dark:bg-[length:200%_100%] dark:animate-gradient-x" />
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-zinc-200/60 dark:bg-fuchsia-500/30 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-zinc-700 dark:text-fuchsia-300" />
                    <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-700 dark:text-fuchsia-200/90 font-semibold">
                      Pro tip
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-ink-100 leading-snug">
                    Liquida nóminas en segundos con cálculos automáticos.
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-zinc-400 dark:text-ink-400 text-center font-mono">v1.0 · Colombia</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </TooltipProvider>
  );
}

/* ── Item de navegación con activeIndicator (layoutId compartido) ──────── */

interface NavItemProps {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
}

function NavItem({ to, label, Icon, collapsed }: NavItemProps) {
  const link = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 h-10 rounded-xl text-sm font-medium transition-colors',
          collapsed ? 'justify-center px-0' : 'px-3',
          isActive
            ? 'text-zinc-900 bg-zinc-100 dark:text-white dark:bg-gradient-to-r dark:from-violet-500/20 dark:via-fuchsia-500/10 dark:to-transparent'
            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-ink-300 dark:hover:text-white dark:hover:bg-white/[0.04]',
        )
      }
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active-indicator"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gradient-brand"
            />
          )}
          <Icon
            className={cn(
              'h-[18px] w-[18px] shrink-0 transition-colors',
              isActive
                ? 'text-zinc-900 dark:text-violet-300'
                : 'text-zinc-500 group-hover:text-zinc-700 dark:text-ink-400 dark:group-hover:text-ink-100',
            )}
            aria-hidden
          />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="label"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
