import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import useCollapsedSidebar from '../hooks/useCollapsedSidebar.js';
import { cn } from '../utils/cn.js';
import BottomNav from './BottomNav.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import { contentOffsetClass, shellTreatmentForRole } from './shell.js';

/**
 * DashboardLayout
 *
 * The signed-in shell (pages 3-17): a fixed sidebar, a fixed top bar, and the
 * page content between them.
 *
 *   desktop  sidebar fixed, content padded left to clear it
 *   mobile   sidebar off-canvas behind a hamburger; volunteer also gets the
 *            bottom tab bar
 *
 * The layout reads the role from AuthContext, so it never needs to be told which
 * dashboard it is wrapping — RoleRoute has already pinned the role by the time
 * this renders.
 *
 * The page body arrives in Steps C-E; until then the dashboards render a
 * placeholder inside this shell.
 */
export default function DashboardLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { collapsed, toggle } = useCollapsedSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role;
  const treatment = shellTreatmentForRole(role);
  const isVolunteer = role === 'VOLUNTEER';

  // Tapping a nav item navigates; the drawer should not stay open over the page.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <Sidebar
        role={role}
        collapsed={collapsed}
        onToggleCollapse={toggle}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-inverse-surface/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <TopBar
        role={role}
        treatment={treatment}
        collapsed={collapsed}
        onOpenMobile={() => setMobileOpen(true)}
      />

      <main
        className={cn(
          'min-h-screen pt-16 transition-[padding] duration-200 md:pt-[72px]',
          contentOffsetClass(treatment, collapsed),
          isVolunteer && 'pb-24 md:pb-0'
        )}
      >
        <div className="w-full p-4 sm:p-space-lg md:p-space-xl">
          <Outlet />
        </div>
      </main>

      {isVolunteer && <BottomNav />}
    </div>
  );
}
