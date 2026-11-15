import { Navigate, Outlet, useLocation } from 'react-router-dom';

import RouteLoader from '../components/shared/RouteLoader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { GUARD_RESULT, resolveGuard } from './guards.js';

/**
 * Requires *a* session, of any role.
 *
 * Used as a pathless parent route so every dashboard below it inherits the
 * check. While the stored token is being verified it renders the loading
 * skeleton rather than bouncing to /login, which would flash the login page at
 * every reload for a signed-in user.
 *
 * `children` is supported so the guard can be rendered directly (and therefore
 * tested) without a matched child route.
 */
export default function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  const verdict = resolveGuard({ status });

  if (verdict === GUARD_RESULT.LOADING) return <RouteLoader />;

  if (verdict === GUARD_RESULT.REDIRECT_LOGIN) {
    // `from` lets the login page return the visitor to where they were headed.
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  }

  return children ?? <Outlet />;
}
