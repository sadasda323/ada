import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Sidebar, MobileSidebar } from './Sidebar';
import { Header } from './Header';
import { MotionPage } from '@/components/ui/motion';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Cerrar el drawer al navegar (por si el item no llamó al onClick)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleToggle = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      // Desktop: colapsar/expandir
      setCollapsed((v) => !v);
    } else {
      // Mobile/tablet: abrir drawer
      setMobileOpen(true);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar collapsed={collapsed} />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onToggleSidebar={handleToggle} />
        <main className="flex-1 overflow-y-auto">
          <MotionPage className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1600px] mx-auto">
            <Outlet />
          </MotionPage>
        </main>
      </div>
    </div>
  );
}
