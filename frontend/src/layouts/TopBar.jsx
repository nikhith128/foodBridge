import { Bell, ChevronDown, ChevronRight, LogOut, Menu, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { Badge } from '../components/ui/index.js';
import { ROLE_LABELS } from '../constants/navigation.js';
import { useAuth } from '../context/AuthContext.jsx';
import { cn } from '../utils/cn.js';
import { topBarForRole, topBarOffsetClass } from './shell.js';

/**
 * TopBar
 *
 * The 72px bar above the content (pages 3 and 8): breadcrumb on the left, a
 * search field in the middle, then the notification bell and the account menu.
 *
 * Two things the screens show but do not draw, resolved here:
 *   - The search field is decorative: the MVP has no search endpoint, so it is
 *     rendered from the screen's markup and nothing more.
 *   - The avatar carries an `expand_more` chevron but no menu exists in the
 *     design. It opens a small account menu with the signed-in name, role and
 *     Log Out, which is also how the portal roles sign out (their sidebar footer
 *     is the "AI Engine Online" block instead of a user card).
 */

function initialsOf(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function TopBar({ role, treatment, collapsed = false, onOpenMobile }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { breadcrumb, searchPlaceholder } = topBarForRole(role);
  const roleLabel = ROLE_LABELS[role] || role || 'Account';

  // A menu that survives a navigation is a menu that hides the page you just
  // opened, so close it whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-30 flex h-16 items-center justify-between gap-space-md bg-surface-container-lowest/90 px-4 shadow-top-bar backdrop-blur-xl transition-[left] md:h-[72px] md:px-space-lg',
        topBarOffsetClass(treatment, collapsed)
      )}
    >
      <div className="flex min-w-0 items-center gap-space-sm">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center font-label-sm text-label-sm text-on-surface-variant"
        >
          {breadcrumb.map((part, index) => (
            <span key={part} className="flex min-w-0 items-center">
              {index > 0 && <ChevronRight className="mx-1 h-4 w-4 shrink-0" aria-hidden="true" />}
              <span className={cn('truncate', index === breadcrumb.length - 1 && 'font-semibold text-secondary')}>
                {part}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="relative mx-auto hidden max-w-md flex-1 items-center md:flex">
        <Search className="absolute left-3 h-4 w-4 text-outline" aria-hidden="true" />
        <input
          type="search"
          placeholder={searchPlaceholder}
          aria-label="Search"
          className="h-10 w-full rounded-lg bg-surface-container-low pl-9 pr-4 font-body-sm text-body-sm text-on-surface shadow-sm transition-colors placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
      </div>

      <div className="flex items-center gap-space-sm md:gap-space-md">
        <button
          type="button"
          title="Notifications — coming soon"
          className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest"
            aria-hidden="true"
          />
          <span className="sr-only">Notifications</span>
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            className="flex items-center gap-space-xs rounded-full p-1 pl-space-xs transition-colors hover:bg-surface-container"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-label-sm font-bold text-on-primary">
              {initialsOf(user?.name)}
            </span>
            <ChevronDown className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Account"
              className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-surface-container-lowest p-2 shadow-overlay ring-1 ring-outline-variant"
            >
              <div className="flex items-center gap-3 rounded-xl px-3 py-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-title-md font-bold text-on-primary">
                  {initialsOf(user?.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-label-md text-label-md font-semibold text-on-surface">
                    {user?.name}
                  </p>
                  <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{user?.email}</p>
                </div>
              </div>

              <div className="px-3 pb-2">
                <Badge variant="positive" size="sm">
                  {roleLabel}
                </Badge>
              </div>

              <div className="my-1 h-px bg-outline-variant" aria-hidden="true" />

              <button
                type="button"
                role="menuitem"
                onClick={() => logout()}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
