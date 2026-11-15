import { Navigate, Outlet } from 'react-router-dom';

import { useAuth, AUTH_STATUS } from '../context/AuthContext.jsx';
import { homePathForRole } from './guards.js';

/**
 * The inverse of ProtectedRoute: keeps signed-in users off the auth pages.
 *
 *   booting        render the page — the stored token is still being checked, and
 *                  showing the form is better than flashing a loader. The page is
 *                  inert until the user submits, by which point the check is done.
 *   authenticated  bounce to the dashboard for their role
 *   anonymous      render the page
 *
 * `children` is supported so the guard can be rendered directly (and therefore
 * tested) without a matched child route.
 */
export default function PublicOnlyRoute({ children }) {
  const { status, user } = useAuth();

  if (status === AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to={homePathForRole(user?.role)} replace />;
  }

  return children ?? <Outlet />;
}
