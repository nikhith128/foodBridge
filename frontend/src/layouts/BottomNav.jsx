import { Link, useLocation } from 'react-router-dom';

import { VOLUNTEER_TABS } from '../constants/navigation.js';
import { cn } from '../utils/cn.js';
import { isItemActive } from './shell.js';

/**
 * BottomNav
 *
 * The volunteer mobile tab bar, from the only screen that shows one (page 14:
 * Dashboard, Tasks, Alerts, Profile). Step B4 decision: volunteer only — donor
 * and NGO mobile use the drawer alone, which is a deliberate divergence from
 * Design.md section 7.
 *
 * Mobile only (`md:hidden`). Alerts carries the small tertiary dot from the
 * screen. Tabs whose page is not built yet stay visible but inert.
 */
export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Volunteer sections"
      className="fixed inset-x-0 bottom-0 z-30 bg-surface/90 pb-[env(safe-area-inset-bottom)] shadow-bottom-nav backdrop-blur-xl md:hidden"
    >
      <div className="flex h-20 items-center justify-around px-space-xs">
        {VOLUNTEER_TABS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(pathname, item);

          const content = (
            <>
              <span className="relative flex items-center justify-center">
                <Icon className="h-6 w-6" aria-hidden="true" />
                {item.badge && (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-tertiary-container"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className="mt-0.5 font-label-sm text-label-sm">{item.label}</span>
            </>
          );

          const className = cn(
            'flex min-h-[48px] min-w-[48px] flex-col items-center justify-center px-2 py-1 transition-colors',
            active ? 'font-semibold text-secondary' : 'text-on-surface-variant',
            !item.built && 'cursor-not-allowed opacity-60'
          );

          if (!item.built) {
            return (
              <span key={item.key} aria-disabled="true" title={`${item.label} — coming soon`} className={className}>
                {content}
              </span>
            );
          }

          return (
            <Link key={item.key} to={item.to} aria-current={active ? 'page' : undefined} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
