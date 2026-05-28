import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MotionPage } from '@/components/ui/motion';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setCollapsed((v) => !v)} />
        <main className="flex-1 overflow-y-auto">
          <MotionPage className="px-4 sm:px-8 py-8 max-w-[1600px] mx-auto">
            <Outlet />
          </MotionPage>
        </main>
      </div>
    </div>
  );
}
