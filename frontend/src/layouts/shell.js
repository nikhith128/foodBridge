/**
 * Shell geometry for the dashboard layout.
 *
 * The Stitch screens use two sidebar treatments (Step B4 decision, "one Sidebar,
 * two treatments"):
 *
 *   donor   w-[260px] bg-primary            pages 3-7
 *   portal  w-72 (288px) bg-primary-container   pages 8-13, 15-17
 *
 * Everything the layout needs to line up — the sidebar width, the content
 * padding, the top-bar offset — is derived from the treatment here, in one
 * place, so the three numbers cannot drift apart. The class strings are written
 * out in full (no interpolation) so Tailwind's scanner can see them.
 */

export const SIDEBAR_TREATMENT = {
  DONOR: 'donor',
  PORTAL: 'portal',
};

/** Which treatment a role gets. Anything that is not a donor is a portal. */
export function shellTreatmentForRole(role) {
  return role === 'DONOR' ? SIDEBAR_TREATMENT.DONOR : SIDEBAR_TREATMENT.PORTAL;
}

/** The sidebar width on mobile (the drawer is always full width there). */
export function sidebarBaseWidthClass(treatment) {
  return treatment === SIDEBAR_TREATMENT.DONOR ? 'w-[260px]' : 'w-72';
}

/** The sidebar width on desktop, honouring the collapsed icon rail. */
export function sidebarWidthClass(treatment, collapsed) {
  if (collapsed) return 'md:w-[72px]';
  return treatment === SIDEBAR_TREATMENT.DONOR ? 'md:w-[260px]' : 'md:w-72';
}

/** The left padding the content area needs to clear the fixed sidebar. */
export function contentOffsetClass(treatment, collapsed) {
  if (collapsed) return 'md:pl-[72px]';
  return treatment === SIDEBAR_TREATMENT.DONOR ? 'md:pl-[260px]' : 'md:pl-72';
}

/** The left offset the fixed top bar needs to start after the sidebar. */
export function topBarOffsetClass(treatment, collapsed) {
  if (collapsed) return 'md:left-[72px]';
  return treatment === SIDEBAR_TREATMENT.DONOR ? 'md:left-[260px]' : 'md:left-72';
}

/**
 * Per-role top-bar copy. The search box is decorative in the MVP (there is no
 * search endpoint), so the placeholder is the only role-specific string.
 */
export const TOP_BAR_BY_ROLE = {
  DONOR: {
    breadcrumb: ['Portal', 'Operations'],
    searchPlaceholder: 'Search donations, food banks, pickup routes...',
  },
  NGO: {
    breadcrumb: ['Portal', 'NGO Operations'],
    searchPlaceholder: 'Search available donations, food types, donors, pickup routes...',
  },
  VOLUNTEER: {
    breadcrumb: ['Portal', 'Field Operations'],
    searchPlaceholder: 'Search tasks, pickup routes...',
  },
};

/** The top-bar copy for a role, with a safe default. */
export function topBarForRole(role) {
  return TOP_BAR_BY_ROLE[role] || { breadcrumb: ['Portal'], searchPlaceholder: 'Search...' };
}

/**
 * Is a nav item the page we are on? An item marked `exact` (the role dashboard)
 * must match the whole path, so /donor/donations does not also light up
 * /donor. Everything else also matches its sub-paths.
 */
export function isItemActive(pathname, item) {
  if (item.exact) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
