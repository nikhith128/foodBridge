import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Inbox,
  Package,
  RefreshCw,
  Truck,
  Utensils,
} from 'lucide-react';

import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { listPickups } from '../../services/pickup.service.js';
import { cn } from '../../utils/cn.js';
import { countdownLabel, formatDateTime } from '../../utils/datetime.js';
import { estimateMeals, formatQuantityWithWeight } from '../../utils/donationFormat.js';
import { donorName } from './NgoDashboard.jsx';

/**
 * AcceptedDonations — page 18, "My Accepted Donations".
 *
 * The source is GET /api/pickups, not GET /api/donations: the NGO donation feed
 * only ever contains AVAILABLE batches, so filtering it for ACCEPTED could only
 * ever produce an empty page. A pickup row is created the moment the NGO claims
 * a batch and carries the donation, the donor and the collection timestamps.
 *
 * The row's primary action follows the lifecycle: confirm the collection on
 * Pickup Management while PENDING, then keep the batch record for reference.
 */

function AcceptedDonationRow({ pickup }) {
  const donation = pickup.donation;
  const pending = pickup.status === 'PENDING';
  const delivered = pickup.status === 'COMPLETED';

  return (
    <li className="flex flex-col gap-3 border-b border-outline-variant px-4 py-4 last:border-b-0 sm:px-5 sm:py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
            <Utensils className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
              {donation?.foodName || `Batch #${donation?.id}`}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {formatQuantityWithWeight(donation?.quantity, donation?.quantityUnit)} ·{' '}
              {donation?.foodCategory}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              From <span className="font-semibold text-on-surface">{donorName(donation)}</span>
            </p>
          </div>
        </div>

        <Badge status={donation?.effectiveStatus || pickup.status} size="sm" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-body-sm">
          <span
            className={cn(
              'inline-flex items-center gap-1.5',
              pending ? 'text-secondary' : 'text-on-surface-variant'
            )}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            {pending
              ? `${countdownLabel(donation?.expiryTime)} to collect`
              : `Accepted ${formatDateTime(pickup.createdAt)}`}
          </span>
          {pickup.pickupTime && (
            <span className="text-on-surface-variant">
              Collected{' '}
              <span className="font-semibold text-on-surface">
                {formatDateTime(pickup.pickupTime)}
              </span>
            </span>
          )}
          {delivered && pickup.deliveryTime && (
            <span className="text-on-surface-variant">
              Delivered{' '}
              <span className="font-semibold text-on-surface">
                {formatDateTime(pickup.deliveryTime)}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {pending && (
            <Link
              to="/ngo/pickups"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container-high hover:text-on-surface"
            >
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
              Record pickup
            </Link>
          )}
          <Link
            to={`/ngo/donations/${donation?.id}`}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-label-md text-label-md font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          >
            View Details
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </li>
  );
}

export default function AcceptedDonations() {
  const { user } = useAuth();
  const { error: raiseError } = useToast();

  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listPickups();
      setPickups(data.pickups || []);
    } catch (apiError) {
      const message = apiError?.message || 'Could not load your accepted donations.';
      setLoadError(message);
      raiseError(message);
    } finally {
      setLoading(false);
    }
  }, [raiseError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // The API scopes pickups to the signed-in NGO; this only avoids a flash of
    // another role's data if the component is ever mounted outside RoleRoute.
    if (user?.role !== 'NGO') {
      setPickups([]);
      setLoading(false);
    }
  }, [user?.role]);

  const accepted = useMemo(
    () =>
      [...pickups].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [pickups]
  );

  const stats = useMemo(() => {
    const awaiting = accepted.filter((p) => p.status === 'PENDING');
    const inTransit = accepted.filter((p) => p.status === 'PICKED_UP');
    const completed = accepted.filter((p) => p.status === 'COMPLETED');

    return {
      total: accepted.length,
      awaiting: awaiting.length,
      inTransit: inTransit.length,
      completed: completed.length,
      meals: completed.reduce(
        (sum, p) => sum + estimateMeals(p.donation?.quantity, p.donation?.quantityUnit),
        0
      ),
    };
  }, [accepted]);

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            NGO Portal
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            {user?.organizationName || user?.name}
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Every batch your organisation has claimed, from collection to delivery.
          </p>
        </div>

        <Button as={Link} to="/ngo" variant="ghost" className="shrink-0">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Dashboard
        </Button>
      </header>

      {loadError && (
        <Banner
          variant="error"
          title="We could not load your accepted donations"
          action={
            <Button size="sm" variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          }
        >
          {loadError}
        </Banner>
      )}

      {/* --- Stats -------------------------------------------------------- */}
      <section aria-label="Donation summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-8 w-20" /></div>
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-8 w-20" /></div>
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-8 w-20" /></div>
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-8 w-20" /></div>
          </>
        ) : (
          <>
            <Card padding="lg" className="xl:col-span-2">
              <h2 className="mb-4 font-headline-sm text-headline-sm font-semibold text-on-surface">
                Donation Summary
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                    <Package className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-body-sm text-label-sm uppercase tracking-wider text-secondary">Total Claimed</p>
                    <p className="font-title-md text-title-md font-bold text-primary">{stats.total}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                    <Truck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-body-sm text-label-sm uppercase tracking-wider text-secondary">Awaiting Pickup</p>
                    <p className="font-title-md text-title-md font-bold text-primary">{stats.awaiting}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-body-sm text-label-sm uppercase tracking-wider text-secondary">Collected</p>
                    <p className="font-title-md text-title-md font-bold text-primary">{stats.inTransit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                    <Utensils className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-body-sm text-label-sm uppercase tracking-wider text-secondary">Meals Rescued</p>
                    <p className="font-title-md text-title-md font-bold text-primary">{stats.meals}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card padding="lg" className="xl:col-span-2">
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Delivery Progress
              </h2>
              <ul className="mt-3 flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <li>
                  <span className="font-semibold text-on-surface">{stats.awaiting}</span> awaiting
                  collection at the donor
                </li>
                <li>
                  <span className="font-semibold text-on-surface">{stats.inTransit}</span> collected
                  and on the way to your kitchen
                </li>
                <li>
                  <span className="font-semibold text-on-surface">{stats.completed}</span> delivered
                  and recorded in your history
                </li>
              </ul>
            </Card>
          </>
        )}
      </section>

      {/* --- Accepted Donations List -------------------------------------- */}
      <section aria-label="Your accepted donations" className="mt-8">
        <Card padding="lg">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Accepted Donations
            </h2>
            <Button
              as={Link}
              to="/ngo/donations"
              variant="ghost"
              className="text-sm font-body-sm text-body-sm text-on-surface-variant hover:underline"
            >
              <Inbox className="h-3 w-3" aria-hidden="true" /> Browse All Donations
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4 px-4 pb-5 sm:px-5">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : accepted.length === 0 ? (
            <EmptyState
              compact
              icon={ClipboardCheck}
              title="No Accepted Donations"
              message="Accept a donation from Available Donations and it will appear here until you confirm delivery."
            >
              <Button as={Link} to="/ngo/donations" variant="primary">
                <Inbox className="h-4 w-4" aria-hidden="true" />
                Browse Available Donations
              </Button>
            </EmptyState>
          ) : (
            <ul className="border-t border-outline-variant space-y-3">
              {accepted.map((pickup) => (
                <AcceptedDonationRow key={pickup.id} pickup={pickup} />
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
