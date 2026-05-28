import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Building2,
  DollarSign, BarChart3, Settings, UserCog, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
}

const links = [
  { to: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/empleados',    label: 'Empleados',     icon: Users },
  { to: '/cargos',       label: 'Cargos',        icon: Briefcase },
  { to: '/areas',        label: 'Áreas',         icon: Building2 },
  { to: '/nomina',       label: 'Nómina',        icon: DollarSign },
  { to: '/novedades',    label: 'Novedades',     icon: FileText },
  { to: '/reportes',     label: 'Reportes',      icon: BarChart3 },
  { to: '/configuracion',label: 'Configuración', icon: Settings },
  { to: '/usuarios',     label: 'Usuarios',      icon: UserCog },
];

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Brand */}
      <div className={cn(
        'flex items-center gap-3 px-4 h-16 border-b border-sidebar-border',
        collapsed && 'justify-center px-0',
      )}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
          HR
        </div>
        {!collapsed && (
          <span className="text-white font-semibold text-base tracking-tight">HRCO</span>
        )}
      </div>

      {/* Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-sidebar-active text-sidebar-textActive'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
                  )
                }
                title={collapsed ? label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border">
        {!collapsed && (
          <div className="text-[10px] uppercase tracking-wider text-sidebar-text/60">
            HRCO v1.0
          </div>
        )}
      </div>
    </aside>
  );
}
