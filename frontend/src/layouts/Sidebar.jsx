import { Leaf, LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Badge } from '../components/ui/index.js';
import Logo from '../components/shared/Logo.jsx';
import { navigationForRole, ROLE_LABELS, ROLE_PORTAL_LABEL } from '../constants/navigation.js';
import { useAuth } from '../context/AuthContext.jsx';
import { cn } from '../utils/cn.js';
import {
  isItemActive,
  shellTreatmentForRole,
  SIDEBAR_TREATMENT,
  sidebarBaseWidthClass,
  sidebarWidthClass,
} from './shell.js';

/**
 * Sidebar
 *
 * One component, two treatments (Step B4 decision):
 *
 *   donor   w-[260px] bg-primary,  items px-space-sm py-2.5 rounded-lg,
 *           active = bg-primary-container plus a 1.5px secondary-fixed bar,
 *           footer = user card + Log Out            (pages 3-7)
 *   portal  w-72 bg-primary-container, items px-space-md py-3 rounded-xl,
 *           active = filled bg-secondary-container, footer = AI Engine Online
 *                                                   (pages 8-13, 15-17)
 *
 * Items whose page is not built yet render as a non-clickable row with a "Soon"
 * pill rather than a link that 404s.
 *
 * Collapse (Design.md section 7): the rail is 72px, labels and the footer text
 * hide, and the choice persists via useCollapsedSidebar. Collapsing is desktop
 * only — the mobile drawer always shows labels — which is why every collapsed
 * rule is an `md:` variant.
 */

const DONOR_ITEM_BASE =
  'flex items-center gap-space-sm px-space-sm py-2.5 rounded-lg font-label-md text-label-md transition-colors';
const DONOR_ITEM_ACTIVE =
  "relative bg-primary-container text-on-primary before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:rounded-r before:bg-secondary-fixed before:content-['']";
const DONOR_ITEM_IDLE = 'text-on-primary/75 hover:bg-primary-container hover:text-on-primary';
const DONOR_ITEM_OFF = 'cursor-not-allowed text-on-primary/40';

const PORTAL_ITEM_BASE =
  'flex items-center gap-3 px-space-md py-3 rounded-xl font-body-md text-body-md transition-colors';
const PORTAL_ITEM_ACTIVE = 'bg-secondary-container font-semibold text-on-secondary-container';
const PORTAL_ITEM_IDLE =
  'text-surface-container-high hover:bg-surface-container-high/10 hover:text-surface-bright';
const PORTAL_ITEM_OFF = 'cursor-not-allowed text-surface-container-high/50';

/** Two-letter avatar initials from a display name. */
function initialsOf(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function SoonPill({ collapsed }) {
  return (
    <span
      className={cn(
        'ml-auto shrink-0 rounded-full bg-on-primary/10 px-2 py-0.5 font-label-sm text-label-sm font-semibold text-on-primary/70',
        collapsed && 'md:hidden'
      )}
    >
      Soon
    </span>
  );
}

function NavRow({ item, active, collapsed, treatment, onNavigate }) {
  const Icon = item.icon;
  const donor = treatment === SIDEBAR_TREATMENT.DONOR;

  const stateClass = active
    ? donor
      ? DONOR_ITEM_ACTIVE
      : PORTAL_ITEM_ACTIVE
    : item.built
      ? donor
        ? DONOR_ITEM_IDLE
        : PORTAL_ITEM_IDLE
      : donor
        ? DONOR_ITEM_OFF
        : PORTAL_ITEM_OFF;

  const className = cn(
    donor ? DONOR_ITEM_BASE : PORTAL_ITEM_BASE,
    stateClass,
    collapsed && 'md:justify-center'
  );

  const inner = (
    <>
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className={cn('truncate', collapsed && 'md:hidden')}>{item.label}</span>
      {!item.built && <SoonPill collapsed={collapsed} />}
    </>
  );

  if (!item.built) {
    return (
      <span
        aria-disabled="true"
        title={`${item.label} — coming soon`}
        className={className}
      >
        {inner}
      </span>
    );
  }

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={className}
    >
      {inner}
    </Link>
  );
}

function CollapseButton({ collapsed, onToggleCollapse }) {
  return (
    <button
      type="button"
      onClick={onToggleCollapse}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!collapsed}
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-primary/70 transition-colors hover:bg-primary-container hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary/40 md:flex"
    >
      {collapsed ? (
        <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
      ) : (
        <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}

export default function Sidebar({
  role,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const treatment = shellTreatmentForRole(role);
  const donor = treatment === SIDEBAR_TREATMENT.DONOR;
  const items = navigationForRole(role);
  const home = items.find((item) => item.exact)?.to || '/';
  const roleLabel = ROLE_LABELS[role] || role || 'Account';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-full flex-col transition-transform duration-200',
        donor
          ? 'bg-primary shadow-sidebar'
          : 'bg-primary-container shadow-sidebar-portal',
        sidebarBaseWidthClass(treatment),
        sidebarWidthClass(treatment, collapsed),
        'md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      aria-label={`${roleLabel} navigation`}
    >
      <button
        type="button"
        onClick={onCloseMobile}
        aria-label="Close menu"
        className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-on-primary/70 transition-colors hover:bg-primary-container hover:text-on-primary md:hidden"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* --- Header ---------------------------------------------------- */}
        {donor ? (
          <div
            className={cn(
              'flex h-[72px] shrink-0 items-center justify-between gap-2 px-space-md',
              collapsed && 'md:h-auto md:flex-col md:gap-3 md:py-3'
            )}
          >
            <Link
              to={home}
              onClick={onCloseMobile}
              className="flex min-w-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary/40"
            >
              <Logo
                tone="on-primary"
                className="min-w-0"
                wordmarkClassName={cn('truncate', collapsed && 'md:hidden')}
              />
            </Link>
            <CollapseButton collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
          </div>
        ) : (
          <div
            className={cn(
              'flex h-[72px] shrink-0 items-center gap-3 px-space-md',
              collapsed && 'md:h-auto md:flex-col md:gap-3 md:py-3'
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className={cn('flex min-w-0 flex-1 flex-col', collapsed && 'md:hidden')}>
              <span className="font-display text-headline-sm leading-none tracking-tight text-surface-bright">
                FoodBridge AI
              </span>
              <span className="mt-1 font-label-sm text-label-sm text-on-primary-container">
                {ROLE_PORTAL_LABEL[role] || 'Portal'}
              </span>
            </div>
            <CollapseButton collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
          </div>
        )}

        {/* --- Section label (portal treatment only) --------------------- */}
        {!donor && (
          <div className={cn('px-space-md py-space-sm', collapsed && 'md:hidden')}>
            <span className="px-space-sm font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container">
              {roleLabel} Navigation
            </span>
          </div>
        )}

        {/* --- Items ----------------------------------------------------- */}
        <nav
          aria-label={`${roleLabel} sections`}
          className={cn(
            'flex flex-1 flex-col overflow-y-auto',
            donor ? 'gap-1.5 px-space-sm py-space-md' : 'space-y-1 px-space-md pb-space-sm'
          )}
        >
          {items.map((item) => (
            <NavRow
              key={item.key}
              item={item}
              // An item whose page is not built cannot be the current page, even
              // when its path is a prefix of the one we are on (which is what
              // would otherwise light up "My Donations" on a donation's
              // matching-results page).
              active={item.built && isItemActive(pathname, item)}
              collapsed={collapsed}
              treatment={treatment}
              onNavigate={onCloseMobile}
            />
          ))}
        </nav>
      </div>

      {/* --- Footer ------------------------------------------------------ */}
      {donor ? (
        <div
          className={cn(
            'm-space-sm shrink-0 rounded-xl bg-primary-container/60 p-space-sm shadow-card',
            collapsed && 'md:bg-transparent md:p-0 md:shadow-none'
          )}
        >
          <div className={cn('mb-space-sm flex items-center gap-space-sm', collapsed && 'md:mb-2 md:justify-center')}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-fixed font-title-md font-bold text-primary">
              {initialsOf(user?.name)}
            </div>
            <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
              <div className="truncate font-label-md text-label-md font-semibold text-on-primary">
                {user?.name}
              </div>
              <Badge variant="positive" size="sm">
                {roleLabel}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className={cn(
              'flex w-full items-center justify-center gap-space-xs rounded-lg px-space-sm py-1.5 font-label-sm text-label-sm text-on-primary/80 transition-colors hover:bg-primary hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary/40',
              collapsed && 'md:px-0'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className={cn(collapsed && 'md:hidden')}>Log Out</span>
          </button>
        </div>
      ) : (
        <div className={cn('shrink-0 p-space-md', collapsed && 'md:hidden')}>
          <div className="flex items-center justify-between rounded-xl bg-primary/40 p-space-md">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary-fixed" aria-hidden="true" />
              <span className="font-label-sm text-label-sm text-surface-bright">AI Engine Online</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-primary-container">v2.4</span>
          </div>
        </div>
      )}
    </aside>
  );
}
