import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button, EmptyState } from '../../components/ui/index.js';

/**
 * 404. Design.md section 11 does not name this state, but an unknown URL has to
 * land somewhere now that the route table is real. It reuses EmptyState so it
 * matches every other empty panel in the app.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <EmptyState
          icon={Compass}
          title="Page not found"
          message="This page does not exist, or it has moved. Check the address, or head back to somewhere useful."
        >
          <Button as={Link} to="/">
            Back to home
          </Button>
          <Button as={Link} to="/login" variant="outline">
            Sign in
          </Button>
        </EmptyState>
      </div>
    </main>
  );
}
