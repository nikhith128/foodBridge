/**
 * Route-guard decisions, as pure functions.
 *
 * The React components in ProtectedRoute.jsx and RoleRoute.jsx render whatever
 * `resolveGuard` returns. Splitting it out is not ceremony: effects do not run
 * during server rendering, so a guard written inside a component cannot be
 * tested without a browser. A pure function can be checked for every
 * status x role combination in scripts/smoke-ui.mjs.
 *
 * Phases.md Step B: "a user registers, logs in and lands on the correct
 * dashboard, and a wrong role is blocked".
 */

export const GUARD_RESULT = {
  /** The session has not been resolved yet — show a loading state. */
  LOADING: 'loading',
  /** No session — send the visitor to the login page. */
  REDIRECT_LOGIN: 'redirect-login',
  /** Signed in, but as the wrong role — show the Restricted page. */
  RESTRICTED: 'restricted',
  /** Allowed — render the page. */
  RENDER: 'render',
};

/** Where each role lands after signing in. */
export const ROLE_HOME = {
  DONOR: '/donor',
  NGO: '/ngo',
  VOLUNTEER: '/volunteer',
};

/** The three dashboards, for navigation lists and the guard demo. */
export const DASHBOARDS = [
  { role: 'DONOR', path: ROLE_HOME.DONOR, label: 'Donor dashboard' },
  { role: 'NGO', path: ROLE_HOME.NGO, label: 'NGO dashboard' },
  { role: 'VOLUNTEER', path: ROLE_HOME.VOLUNTEER, label: 'Volunteer dashboard' },
];

/** The dashboard path for a role, or '/' when the role is unknown. */
export function homePathForRole(role) {
  return ROLE_HOME[role] || '/';
}

/**
 * @param {object} input
 * @param {'booting'|'authenticated'|'anonymous'} input.status
 * @param {string|null} [input.role]         the signed-in user's role
 * @param {string|null} [input.requiredRole] the role the page demands
 * @returns {'loading'|'redirect-login'|'restricted'|'render'}
 */
export function resolveGuard({ status, role = null, requiredRole = null }) {
  if (status === 'booting') return GUARD_RESULT.LOADING;
  if (status !== 'authenticated') return GUARD_RESULT.REDIRECT_LOGIN;
  if (requiredRole && role !== requiredRole) return GUARD_RESULT.RESTRICTED;
  return GUARD_RESULT.RENDER;
}
