import { ChevronDown, Globe, LogOut, Mail, MapPin, MessagesSquare, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import Logo from '../components/shared/Logo.jsx';
import { PUBLIC_ACCOUNT_LINKS, PUBLIC_NAV, ROLE_LABELS } from '../constants/navigation.js';
import { AUTH_STATUS, useAuth } from '../context/AuthContext.jsx';
import { homePathForRole } from '../routes/guards.js';
import { cn } from '../utils/cn.js';

/**
 * PublicLayout
 *
 * The signed-out shell, from the Stitch landing screen (page 1, shell-type
 * `web_standard`):
 *
 *   header  fixed, h-20, bg-surface/80 backdrop-blur-xl, shadow-header
 *   main    fills the viewport, pushed down by the fixed header (pt-20)
 *   footer  full-width bg-primary, four columns, dark ink
 *
 * The pages themselves arrive in Step B5; this only owns the chrome. Items whose
 * page is not built yet (About Us, How It Works) render as inert text rather than
 * links that 404 — the same "not built yet" rule the sidebar uses.
 */

// --- Small pieces -----------------------------------------------------------

// The active nav item, from the landing screen: bold primary text with a short
// underline bar. The underline is a pseudo-element so it does not shift layout.
const ACTIVE_NAV_CLASS =
  "font-label-md text-label-md text-primary after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary after:content-['']";

function HeaderNavItem({ item }) {
  if (!item.built) {
    return (
      <span
        aria-disabled="true"
        title="Coming soon"
        className="cursor-not-allowed font-body-md text-body-md text-on-surface-variant/50"
      >
        {item.label}
      </span>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'relative rounded-lg font-body-md text-body-md transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
          isActive ? ACTIVE_NAV_CLASS : 'text-on-surface-variant hover:text-on-surface'
        )
      }
    >
      {item.label}
    </NavLink>
  );
}

function FooterLink({ item }) {
  if (!item.built) {
    return <span className="font-body-md text-body-md text-on-primary/70">{item.label}</span>;
  }

  return (
    <Link
      to={item.to}
      className="font-body-md text-body-md text-on-primary-container transition-colors hover:text-on-primary"
    >
      {item.label}
    </Link>
  );
}

function FooterHeading({ children }) {
  return <h2 className="mb-space-xs font-title-md text-title-md text-on-primary">{children}</h2>;
}

function initialsOf(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/**
 * The signed-in account menu in the public header.
 *
 * Signed-out visitors get Login/Register instead (see the layout below), so
 * this only ever renders an avatar. Same interaction contract as TopBar: the
 * menu closes on navigation, outside click and Escape.
 */
function AccountMenu({ user, logout }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const roleLabel = ROLE_LABELS[user?.role] || 'Account';

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-space-xs rounded-full p-1 pl-space-xs transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-label-sm font-bold text-on-primary">
          {initialsOf(user?.name)}
        </span>
        <ChevronDown className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl bg-surface-container-lowest p-2 shadow-overlay ring-1 ring-outline-variant"
        >
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-title-md font-bold text-on-primary">
              {initialsOf(user?.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-label-md text-label-md font-semibold text-on-surface">{user?.name}</p>
              <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{user?.email}</p>
            </div>
          </div>

          <div className="px-3 pb-2">
            <span className="inline-flex items-center rounded-full bg-secondary-container px-2.5 py-1 font-label-sm text-label-sm font-semibold text-on-secondary-container">
              {roleLabel}
            </span>
          </div>

          <div className="my-1 h-px bg-outline-variant" aria-hidden="true" />

          <Link
            to={homePathForRole(user?.role)}
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            Go to dashboard
          </Link>

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
  );
}

const SOCIALS = [
  { key: 'network', label: 'Community Network', icon: Share2 },
  { key: 'impact', label: 'Global Impact', icon: Globe },
  { key: 'forum', label: 'Discussion Forum', icon: MessagesSquare },
];

// --- Layout -----------------------------------------------------------------

export default function PublicLayout() {
  const { pathname } = useLocation();
  const { user, status, isAuthenticated, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="fixed inset-x-0 top-0 z-50 bg-surface/80 shadow-header backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-space-md px-margin">
          <Link
            to="/"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <Logo />
            <span className="sr-only">FoodBridge AI — home</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-space-lg md:flex">
            {PUBLIC_NAV.map((item) => (
              <HeaderNavItem key={item.key} item={item} />
            ))}
          </nav>

          <div className="flex items-center gap-space-sm">
            {status === AUTH_STATUS.BOOTING ? (
              // Resolving the stored token. Reserve the avatar's footprint so
              // the header does not jump when the session lands.
              <span
                aria-hidden="true"
                className="h-8 w-8 animate-pulse rounded-full bg-surface-container-high motion-reduce:animate-none"
              />
            ) : isAuthenticated ? (
              <AccountMenu user={user} logout={logout} />
            ) : (
              <>
                {pathname !== '/login' && (
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-lg px-space-md py-space-sm font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                  >
                    Login
                  </Link>
                )}
                {pathname !== '/register' && (
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-space-md py-space-sm font-label-md text-label-md text-on-primary shadow-button-soft transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    Register
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-20">
        <Outlet />
      </main>

      <footer className="w-full bg-primary pt-space-xl pb-space-lg text-on-primary">
        <div className="mx-auto max-w-7xl px-margin">
          <div className="grid grid-cols-1 gap-space-xl pb-space-xl md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-space-md">
              <Logo tone="on-primary" />
              <p className="font-label-md text-label-md leading-snug text-secondary-fixed">
                Rescue Food. Connect Communities. Reduce Waste.
              </p>
              <p className="font-body-sm text-body-sm leading-relaxed text-on-primary-container">
                An AI-guided surplus logistics network connecting commercial food donors to local food
                shelters and field response units with zero friction.
              </p>
            </div>

            <nav aria-label="Quick links" className="flex flex-col gap-space-sm">
              <FooterHeading>Quick Links</FooterHeading>
              {PUBLIC_NAV.map((item) => (
                <FooterLink key={item.key} item={item} />
              ))}
            </nav>

            <nav aria-label="Account" className="flex flex-col gap-space-sm">
              <FooterHeading>Account</FooterHeading>
              {PUBLIC_ACCOUNT_LINKS.map((item) => (
                <FooterLink key={item.key} item={item} />
              ))}
            </nav>

            <div className="flex flex-col gap-space-sm">
              <FooterHeading>Contact &amp; Community</FooterHeading>
              <a
                href="mailto:hello@foodbridge.ai"
                className="flex items-center gap-space-xs font-body-md text-body-md text-on-primary-container transition-colors hover:text-on-primary"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                hello@foodbridge.ai
              </a>
              <span className="flex items-center gap-space-xs font-body-md text-body-md text-on-primary-container">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                City Hubs — coming soon
              </span>
              <div className="flex items-center gap-space-sm pt-space-xs">
                {SOCIALS.map((social) => (
                  <span
                    key={social.key}
                    title={social.label}
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary"
                  >
                    <social.icon className="h-4 w-4" />
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-space-sm border-t border-primary-container pt-space-lg md:flex-row">
            <p className="font-body-md text-body-md text-on-primary-container">
              © 2026 FoodBridge AI. All rights reserved.
            </p>
            <div className="flex items-center gap-space-md">
              <span className="font-body-md text-body-md text-on-primary-container">Privacy Policy</span>
              <span className="font-body-md text-body-md text-on-primary-container">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
