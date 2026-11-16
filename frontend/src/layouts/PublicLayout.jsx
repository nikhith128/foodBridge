import { Globe, Mail, MapPin, MessagesSquare, Share2, User } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import Logo from '../components/shared/Logo.jsx';
import { PUBLIC_ACCOUNT_LINKS, PUBLIC_NAV } from '../constants/navigation.js';
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
    return <span className="font-body-sm text-body-sm text-on-primary-container/60">{item.label}</span>;
  }

  return (
    <Link
      to={item.to}
      className="font-body-sm text-body-sm text-on-primary-container transition-colors hover:text-on-primary"
    >
      {item.label}
    </Link>
  );
}

function FooterHeading({ children }) {
  return <h2 className="mb-space-xs font-title-md text-title-md text-on-primary">{children}</h2>;
}

const SOCIALS = [
  { key: 'network', label: 'Community Network', icon: Share2 },
  { key: 'impact', label: 'Global Impact', icon: Globe },
  { key: 'forum', label: 'Discussion Forum', icon: MessagesSquare },
];

// --- Layout -----------------------------------------------------------------

export default function PublicLayout() {
  const { pathname } = useLocation();

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
            <span
              className="ml-space-xs flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary"
              aria-hidden="true"
            >
              <User className="h-4 w-4" />
            </span>
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
                className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-primary-container transition-colors hover:text-on-primary"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                hello@foodbridge.ai
              </a>
              <span className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-primary-container">
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
            <p className="font-body-sm text-body-sm text-on-primary-container">
              © 2026 FoodBridge AI. All rights reserved.
            </p>
            <div className="flex items-center gap-space-md">
              <span className="font-body-sm text-body-sm text-on-primary-container">Privacy Policy</span>
              <span className="font-body-sm text-body-sm text-on-primary-container">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
