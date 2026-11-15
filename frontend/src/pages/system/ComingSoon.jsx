import { Hammer } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button, Card, EmptyState } from '../../components/ui/index.js';
import { DASHBOARDS } from '../../routes/guards.js';

/**
 * TEMPORARY page (Step B3 only).
 *
 * Stands in for Home, Register and Login until Step B5 builds them from the
 * Stitch screens. The dashboard links exist so the route guards can be tried
 * by hand before there is a login form to sign in with.
 */
export default function ComingSoon({ title, description }) {
  return (
    <div className="flex items-center justify-center px-4 py-16 sm:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <EmptyState icon={Hammer} title={title} message={description}>
          <Button as={Link} to="/register" variant="outline">
            Register
          </Button>
          <Button as={Link} to="/login">Sign in</Button>
        </EmptyState>

        <Card className="flex flex-col gap-3">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
            Step B3 checkpoint — route guards
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            The login form arrives in Step B5. Until then, these links are the quickest way to see
            the guards work: an anonymous visitor is sent here, and a signed-in user only reaches
            their own dashboard.
          </p>
          <div className="flex flex-wrap gap-2">
            {DASHBOARDS.map((dashboard) => (
              <Button key={dashboard.path} as={Link} to={dashboard.path} size="sm" variant="container">
                {dashboard.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
