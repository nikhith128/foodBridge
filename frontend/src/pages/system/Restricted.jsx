import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button, EmptyState } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { homePathForRole } from '../../routes/guards.js';

/**
 * The "Restricted" system state from Design.md section 11.
 *
 * Shown by RoleRoute when a signed-in user opens a dashboard that belongs to a
 * different role. The session is left intact — they are not signed out, they
 * are simply pointed back at the dashboard their role actually owns.
 */
export default function Restricted() {
  const { user } = useAuth();
  const home = homePathForRole(user?.role);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <EmptyState
          icon={ShieldAlert}
          title="Restricted"
          message="Your account does not have permission to open this page. Each dashboard is limited to one role."
        >
          {user ? (
            <>
              <Button as={Link} to={home}>
                Go to my dashboard
              </Button>
              <Button as={Link} to="/login" variant="outline">
                Switch account
              </Button>
            </>
          ) : (
            <Button as={Link} to="/login">
              Sign in
            </Button>
          )}
        </EmptyState>
      </div>
    </main>
  );
}
