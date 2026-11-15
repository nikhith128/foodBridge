import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Inbox,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Truck,
  Utensils,
  XCircle,
} from 'lucide-react';

import { Badge, Banner, Button, Card, EmptyState, Skeleton, useToast } from '../../components/ui/index.js';
import { StatCard } from '../../components/shared/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { listDonations } from '../../services/donation.service.js';
import { cn } from '../../utils/cn.js';
import { countdownLabel, formatDateTime, isPast, minutesUntil } from '../../utils/datetime.js';
import {
  estimateMeals,
  formatQuantityWithWeight,
  isActiveStatus,
} from '../../utils/donationFormat.js';

/**
 * DonorDashboard — the donor's landing page (Step C).
 *
 * Rebuilt from the Stitch Donor Dashboard screen (page 3, shell `web_dashboard`).
 * Every figure on this page is computed from GET /api/donations; nothing is
 * hard-coded. The screen's demo numbers (148 donations, 4,850 meals, "99.4%
 * verified", "+12% from last month") are replaced by real counts, and a counter
 * with no data reads 0 rather than borrowing a flattering figure.
 *
 * What the screen shows but this page does not:
 *   - the "Preview State" ribbon and the offline alert, which are Stitch devices
 *     for stepping through mock states;
 *   - the live transit radar and "Needs Attention" telemetry, which need a
 *     realtime feed the MVP does not have;
 *   - the "Quick NGO Partners" affinity list, which would need an NGO-relations
 *     endpoint that is not in Architecture.md section 8.
 */

// --- Local pieces -----------------------------------------------------------

function StatSkeleton() {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

function statusToneClass(status) {
  if (status === 'AVAILABLE') return 'text-secondary';
  if (status === 'COMPLETED') return 'text-primary';
  if (status === 'EXPIRED' || status === 'CANCELLED') return 'text-outline';
  return 'text-on-surface-variant';
}

/** The right-hand column of the recent-donations table, per status. */
function DonationAction({ donation }) {
  if (donation.effectiveStatus === 'AVAILABLE') {
    return (
      <Link
        to={`/donor/donations/${donation.id}/matches`}
        className="inline-flex items-center gap-1 font-label-md text-label-md font-semibold text-secondary hover:underline"
      >
        View Matches
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    );
  }

  const note = {
    ACCEPTED: 'Pickup coordination is coming soon.',
    ASSIGNED: 'A volunteer has been assigned. Tracking is coming soon.',
    PICKED_UP: 'Collected and on the way to the NGO.',
    COMPLETED: 'Delivered and verified.',
    EXPIRED: 'The collection deadline passed.',
    CANCELLED: 'You withdrew this donation.',
  }[donation.effectiveStatus];

  return <span className="font-body-sm text-body-sm text-on-surface-variant">{note}</span>;
}

function RecentDonationRow({ donation }) {
  const minutes = minutesUntil(donation.expiryTime);
  const expired = donation.effectiveStatus === 'EXPIRED' || minutes <= 0;

  return (
    <li className="flex flex-col gap-3 border-b border-outline-variant px-4 py-4 last:border-b-0 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
            <Utensils className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
              {donation.foodName}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {formatQuantityWithWeight(donation.quantity, donation.quantityUnit)} ·{' '}
              {donation.foodCategory}
            </p>
          </div>
        </div>

        <Badge status={donation.effectiveStatus} size="sm" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-body-sm">
          <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {expired ? 'Deadline passed' : countdownLabel(donation.expiryTime)}
          </span>
          {donation.matchedNgo && (
            <span className="text-on-surface-variant">
              Recipient: <span className="font-semibold">{donation.matchedNgo.organizationName}</span>
            </span>
          )}
          <span className={cn('text-on-surface-variant', statusToneClass(donation.effectiveStatus))}>
            {expired ? formatDateTime(donation.expiryTime) : `Deadline ${formatDateTime(donation.expiryTime)}`}
          </span>
        </div>

        <DonationAction donation={donation} />
      </div>
    </li>
  );
}

const OVERVIEW_ROWS = [
  { key: 'available', label: 'Available (matching)', statuses: ['AVAILABLE'], icon: Inbox },
  { key: 'accepted', label: 'Accepted (awaiting pickup)', statuses: ['ACCEPTED', 'ASSIGNED'], icon: ClipboardList },
  { key: 'transit', label: 'In transit (dispatched)', statuses: ['PICKED_UP'], icon: Truck },
  { key: 'completed', label: 'Completed & verified', statuses: ['COMPLETED'], icon: CheckCircle2 },
  { key: 'closed', label: 'Expired or withdrawn', statuses: ['EXPIRED', 'CANCELLED'], icon: XCircle },
];

function StatusOverview({ donations }) {
  const total = donations.length || 1;

  return (
    <Card padding="lg">
      <div className="mb-5">
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          Donation Status Overview
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          How your published donations are currently distributed.
        </p>
      </div>

      <ul className="flex flex-col gap-4">
        {OVERVIEW_ROWS.map((row) => {
          const count = donations.filter((d) => row.statuses.includes(d.effectiveStatus)).length;
          const Icon = row.icon;
          const width = Math.round((count / total) * 100);

          return (
            <li key={row.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
                  <Icon className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
                  {row.label}
                </span>
                <span className="font-label-md text-label-md font-semibold text-on-surface">
                  {count} {count === 1 ? 'donation' : 'donations'}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                <span
                  className="block h-full rounded-full bg-secondary"
                  style={{ width: `${width}%` }}
                  aria-hidden="true"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// --- Page -------------------------------------------------------------------

export default function DonorDashboard() {
  const { user } = useAuth();
  const { error: raiseError } = useToast();

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listDonations();
      setDonations(data.donations || []);
    } catch (apiError) {
      setLoadError(apiError?.message || 'Could not load your donations.');
      raiseError(apiError?.message || 'Could not load your donations.');
    } finally {
      setLoading(false);
    }
  }, [raiseError]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = donations.filter((d) => isActiveStatus(d.effectiveStatus));
    const completed = donations.filter((d) => d.effectiveStatus === 'COMPLETED');
    const meals = completed.reduce((sum, d) => sum + estimateMeals(d.quantity, d.quantityUnit), 0);

    return {
      total: donations.length,
      active: active.length,
      completed: completed.length,
      meals,
    };
  }, [donations]);

  const recent = useMemo(
    () =>
      [...donations]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [donations]
  );

  const expiringSoon = useMemo(
    () =>
      donations.filter(
        (d) => d.effectiveStatus === 'AVAILABLE' && !isPast(d.expiryTime) && minutesUntil(d.expiryTime) <= 120
      ),
    [donations]
  );

  const firstName = (user?.name || 'there').split(' ')[0];
  const facility = user?.organizationName || user?.name;

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            Live Rescue Network
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Your food rescue operations summary for{' '}
            <span className="font-semibold text-on-surface">{facility}</span>.
          </p>
        </div>

        <Button as={Link} to="/donor/donations/new" variant="primary" className="shrink-0">
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Create Donation
        </Button>
      </header>

      {loadError && (
        <Banner
          variant="error"
          title="We could not load your donations"
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
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Donations"
              icon={ClipboardList}
              value={stats.total}
              accent
              footer={<span>Published from this facility</span>}
            />
            <StatCard
              label="Active Donations"
              icon={Sparkles}
              tone="secondary"
              valueTone="secondary"
              value={stats.active}
              footer={<span>Matching, accepted or in transit</span>}
            />
            <StatCard
              label="Completed Donations"
              icon={CheckCircle2}
              value={stats.completed}
              footer={<span>Delivered and verified</span>}
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

      {/* --- Create CTA --------------------------------------------------- */}
      <Card
        padding="lg"
        className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-container to-primary text-on-primary"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary-fixed/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-container-lowest/15 text-secondary-fixed">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">
                AI-assisted matching
              </p>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-primary">
                Have surplus food? Create a donation
              </h2>
              <p className="mt-1 max-w-xl font-body-sm text-body-sm text-on-primary-container">
                Log the batch and the matching engine ranks nearby verified NGOs by capacity, food
                compatibility, distance and time left before the deadline.
              </p>
            </div>
          </div>

          <Button as={Link} to="/donor/donations/new" variant="secondary" className="shrink-0">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Create Donation Now
          </Button>
        </div>
      </Card>

      {expiringSoon.length > 0 && (
        <Banner variant="warning" title="A donation is nearing its collection deadline">
          {expiringSoon.length === 1
            ? `${expiringSoon[0].foodName} expires in ${countdownLabel(expiringSoon[0].expiryTime)}.`
            : `${expiringSoon.length} donations expire within the next two hours.`}
        </Banner>
      )}

      {/* --- Recent donations --------------------------------------------- */}
      <section className="grid grid-cols-1 gap-space-lg xl:grid-cols-3">
        <Card padding="none" className="overflow-hidden xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 pt-5 sm:px-5">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Recent Donations
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Your most recent published batches and their progress.
              </p>
            </div>
            {!loading && donations.length > 0 && (
              <Badge variant="neutral" size="sm">
                {donations.length} total
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-4 px-4 pb-5 sm:px-5">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : recent.length === 0 ? (
            <div className="px-4 pb-5 sm:px-5">
              <EmptyState
                compact
                icon={Inbox}
                title="No Donations Active Right Now"
                message="Publish your first surplus batch and the matching engine will find a nearby verified NGO for it."
              >
                <Button as={Link} to="/donor/donations/new" variant="primary">
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  Create First Donation
                </Button>
              </EmptyState>
            </div>
          ) : (
            <ul className="border-t border-outline-variant">
              {recent.map((donation) => (
                <RecentDonationRow key={donation.id} donation={donation} />
              ))}
            </ul>
          )}
        </Card>

        {loading ? (
          <Card padding="lg">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-3 w-56" />
            <div className="mt-6 flex flex-col gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        ) : (
          <StatusOverview donations={donations} />
        )}
      </section>

      {!loading && donations.length > 0 && (
        <p className="font-label-sm text-label-sm text-outline">
          Showing your active and most recent donations.
        </p>
      )}
    </div>
  );
}
