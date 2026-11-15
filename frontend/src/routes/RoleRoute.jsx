import { Navigate, Outlet } from 'react-router-dom';

import RouteLoader from '../components/shared/RouteLoader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Restricted from '../pages/system/Restricted.jsx';
import { GUARD_RESULT, resolveGuard } from './guards.js';

/**
 * Requires a session *and* a specific role.
 *
 * A signed-in user who opens another role's page sees the Restricted state
 * (Design.md section 11) rather than being silently redirected, so the rule is
 * visible instead of mysterious. The backend enforces the same rule with
 * requireRole — this is the UI half of it, not the security boundary.
 *
 * Nest inside <ProtectedRoute> so anonymous visitors are sent to /login before
 * the role is ever considered.
 */
export default function RoleRoute({ role, children }) {
  const { status, user } = useAuth();

  const verdict = resolveGuard({ status, role: user?.role ?? null, requiredRole: role });

  if (verdict === GUARD_RESULT.LOADING) return <RouteLoader />;
  if (verdict === GUARD_RESULT.REDIRECT_LOGIN) return <Navigate to="/login" replace />;
  if (verdict === GUARD_RESULT.RESTRICTED) return <Restricted />;

  return children ?? <Outlet />;
}
