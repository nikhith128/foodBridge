import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Clock,
  Inbox,
  MapPin,
  Package,
  RefreshCw,
  Sparkles,
  Truck,
  Utensils,
} from 'lucide-react';

import { Badge, Banner, Button, Card, EmptyState, Skeleton, useToast } from '../../components/ui/index.js';
import { StatCard } from '../../components/shared/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { listDonations } from '../../services/donation.service.js';
import { listPickups } from '../../services/pickup.service.js';
import { cn } from '../../utils/cn.js';
import { countdownLabel, minutesUntil } from '../../utils/datetime.js';
import { estimateMeals, formatQuantityWithWeight } from '../../utils/donationFormat.js';
import { isOpenPickup, pickupStep } from '../../utils/pickupFormat.js';

/**
 * NgoDashboard — the NGO's landing page (Step D).
 *
 * Rebuilt from the Stitch NGO Dashboard screen (page 8, shell `web_portal_ngo`).
 * Every figure comes from GET /api/donations (the available feed, each batch
 * scored for this NGO) and GET /api/pickups (the batches it has claimed).
 *
 * What the screen shows but this page does not, because the MVP has no data
 * behind it: the "NGO Preview State" ribbon, the live intake telemetry, the
 * 5 km radius scanner with "Re-scan Radius", the volunteer roster and "Driver at
 * Gate" alerts, the "Update Capacity" editor (the API has no capacity-update
 * endpoint yet), and the FSSAI/Good Samaritan legal panels.
 */

function StatSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

/** The donor's display name: the facility for a business, the person otherwise. */
export function donorName(donation) {
  return donation?.donor?.organizationName || donation?.donor?.name || 'A donor';
}

function RecommendationCard({ donation }) {
  const fit = donation.forYou;
  const minutes = minutesUntil(donation.expiryTime);
  const urgent = minutes > 0 && minutes <= 60;

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
            <Utensils className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
              {donation.foodName}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{donorName(donation)}</p>
          </div>
        </div>

        {typeof fit?.score === 'number' && (
          <span className="flex shrink-0 items-baseline gap-0.5">
            <span className="font-display text-headline-sm font-bold text-secondary">
              {Math.round(fit.score)}
            </span>
            <span className="font-label-md text-label-md font-semibold text-on-surface-variant">%</span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-body-sm text-body-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5">
          <Package className="h-4 w-4" aria-hidden="true" />
          {formatQuantityWithWeight(donation.quantity, donation.quantityUnit)}
        </span>
        {typeof fit?.distanceKm === 'number' && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {fit.distanceKm} km away
          </span>
        )}
        <span
          className={cn('inline-flex items-center gap-1.5', urgent ? 'text-error' : 'text-secondary')}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          {countdownLabel(donation.expiryTime)}
        </span>
      </div>

      <Button as={Link} to={`/ngo/donations/${donation.id}`} variant="primary" size="sm">
        Review &amp; Accept
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </Card>
  );
}

function ActivePickupRow({ pickup }) {
  const step = pickupStep(pickup.status);
  const donation = pickup.donation;

  return (
    <li className="flex flex-col gap-2 border-b border-outline-variant px-4 py-4 last:border-b-0 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
            {donation?.foodName}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {donorName(donation)} · {formatQuantityWithWeight(donation?.quantity, donation?.quantityUnit)}
          </p>
        </div>
        <Badge status={pickup.status} size="sm" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-body-sm text-body-sm text-on-surface-variant">{step?.help}</span>
        <Link
          to="/ngo/pickups"
          className="inline-flex items-center gap-1 font-label-md text-label-md font-semibold text-secondary hover:underline"
        >
          Manage
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}

export default function NgoDashboard() {
  const { user } = useAuth();
  const { error: raiseError } = useToast();

  const [donations, setDonations] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [donationData, pickupData] = await Promise.all([listDonations(), listPickups()]);
      setDonations(donationData.donations || []);
      setPickups(pickupData.pickups || []);
    } catch (apiError) {
      const message = apiError?.message || 'Could not load your dashboard.';
      setLoadError(message);
      raiseError(message);
    } finally {
      setLoading(false);
    }
  }, [raiseError]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const completed = pickups.filter((p) => p.status === 'COMPLETED');
    return {
      available: donations.length,
      eligible: donations.filter((d) => d.forYou?.eligible).length,
      awaiting: pickups.filter((p) => p.status === 'PENDING').length,
      collected: pickups.filter((p) => p.status === 'PICKED_UP').length,
      completed: completed.length,
      meals: completed.reduce(
        (sum, p) => sum + estimateMeals(p.donation?.quantity, p.donation?.quantityUnit),
        0
      ),
    };
  }, [donations, pickups]);

  const recommended = useMemo(
    () =>
      [...donations]
        .filter((d) => d.forYou?.eligible && typeof d.forYou.score === 'number')
        .sort((a, b) => b.forYou.score - a.forYou.score)
        .slice(0, 3),
    [donations]
  );

  const activePickups = useMemo(
    () =>
      [...pickups]
        .filter((p) => isOpenPickup(p.status))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [pickups]
  );

  const orgName = user?.organizationName || user?.name || 'your organisation';

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            NGO Portal
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            Welcome, {orgName}
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Available surplus near you, the batches you have claimed, and the collections still open.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" disabled title="Coming soon" className="shrink-0">
            Update Capacity
          </Button>
          <Button as={Link} to="/ngo/donations" variant="primary" className="shrink-0">
            <Inbox className="h-4 w-4" aria-hidden="true" />
            Browse All Donations
          </Button>
        </div>
      </header>

      {loadError && (
        <Banner
          variant="error"
          title="We could not load your dashboard"
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
      <section aria-label="Intake summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Available Nearby"
              icon={Inbox}
              value={stats.available}
              unit="batches"
              accent
              footer={
                <span>
                  {stats.eligible === 0
                    ? 'None match your intake profile'
                    : `${stats.eligible} match your intake profile`}
                </span>
              }
            />
            <StatCard
              label="Accepted Donations"
              icon={ClipboardCheck}
              tone="secondary"
              valueTone="secondary"
              value={stats.awaiting + stats.collected}
              unit="batches"
              footer={
                <span>
                  {stats.awaiting} awaiting pickup
                  {stats.collected > 0 ? ` · ${stats.collected} collected` : ''}
                </span>
              }
            />
            <StatCard
              label="Completed Collections"
              icon={Truck}
              value={stats.completed}
              unit="batches"
              footer={<span>Delivered to your kitchen</span>}
            />
            <StatCard
              label="Meals Rescued"
              icon={Utensils}
              tone="secondary"
              value={stats.meals}
              unit="meals"
              footer={<span className="italic">Estimated from completed batches</span>}
            />
          </>
        )}
      </section>

      {/* --- Recommended for you ------------------------------------------ */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Recommended For You
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              The best-scoring available batches for your intake profile.
            </p>
          </div>
          <Button as={Link} to="/ngo/donations" variant="ghost" size="sm">
            View all
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : recommended.length === 0 ? (
          <EmptyState
            compact
            icon={Sparkles}
            title="No matches right now"
            message="There are no available batches that fit your capacity, dietary profile and location at the moment. New surplus will appear here as donors publish it."
          >
            <Button as={Link} to="/ngo/donations" variant="primary">
              <Inbox className="h-4 w-4" aria-hidden="true" />
              Browse all donations
            </Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {recommended.map((donation) => (
              <RecommendationCard key={donation.id} donation={donation} />
            ))}
          </div>
        )}
      </section>

      {/* --- Active collections ------------------------------------------- */}
      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 pt-5 sm:px-5">
          <div>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Active Collections
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Batches you have accepted that are not yet delivered.
            </p>
          </div>
          {!loading && (
            <Badge variant="neutral" size="sm">
              {activePickups.length} open
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4 px-4 pb-5 sm:px-5">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : activePickups.length === 0 ? (
          <div className="px-4 pb-5 sm:px-5">
            <EmptyState
              compact
              icon={ClipboardCheck}
              title="Nothing waiting on you"
              message="Accept a batch from Available Donations and it will appear here until you confirm delivery."
            />
          </div>
        ) : (
          <ul className="border-t border-outline-variant">
            {activePickups.map((pickup) => (
              <ActivePickupRow key={pickup.id} pickup={pickup} />
            ))}
          </ul>
        )}
      </Card>

      {!loading && (
        <p className="flex items-center gap-2 font-label-sm text-label-sm text-outline">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          Only verified, accepting NGOs are recommended by the matching engine.
        </p>
      )}
    </div>
  );
}
