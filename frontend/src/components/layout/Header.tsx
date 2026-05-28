import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/services/auth.service';
import { initials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const rolLabel: Record<string, string> = {
  ADMIN_EMPRESA: 'Administrador de Empresa',
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
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    clear();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Alternar menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-3" ref={ref}>
        {user && (
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-slate-900">
              {user.nombre} {user.apellido}
            </span>
            <span className="text-xs text-slate-500">{rolLabel[user.rol] || user.rol}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 group"
        >
          <span className="h-9 w-9 rounded-full bg-brand-600 text-white text-sm font-semibold flex items-center justify-center">
            {user ? initials(user.nombre, user.apellido) : '?'}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute right-4 top-14 mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-elevated z-40 animate-fade-in">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">{user?.nombre} {user?.apellido}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <div className="py-1">
              <button
                type="button"
                onClick={() => navigate('/configuracion')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserIcon className="h-4 w-4" /> Mi cuenta
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
