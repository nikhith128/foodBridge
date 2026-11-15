import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Heart,
  Inbox,
  MapPin,
  Package,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Trash2,
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
import { listDonations } from '../../services/donation.service.js';
import { cn } from '../../utils/cn.js';
import { countdownLabel, formatDateTime, isPast, minutesUntil } from '../../utils/datetime.js';
import {
  estimateMeals,
  formatQuantityWithWeight,
  isActiveStatus,
} from '../../utils/donationFormat.js';

function statusToneClass(status) {
  if (status === 'AVAILABLE') return 'text-secondary';
  if (status === 'COMPLETED') return 'text-primary';
  if (status === 'EXPIRED' || status === 'CANCELLED') return 'text-outline';
  return 'text-on-surface-variant';
}

/** The four tabs Design.md page 9 asks for, each keyed to its stored statuses. */
const DONATION_TABS = [
  { key: 'ACTIVE', label: 'Active', statuses: ['AVAILABLE', 'ACCEPTED', 'ASSIGNED', 'PICKED_UP'] },
  { key: 'COMPLETED', label: 'Completed', statuses: ['COMPLETED'] },
  { key: 'EXPIRED', label: 'Expired', statuses: ['EXPIRED'] },
  { key: 'CANCELLED', label: 'Cancelled', statuses: ['CANCELLED'] },
];

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
              <Link
                to={`/donor/donations/${donation.id}`}
                className="hover:text-primary hover:underline"
              >
                {donation.foodName}
              </Link>
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

        <Link
          to={`/donor/donations/${donation.id}/matches`}
          className="inline-flex items-center gap-1 font-label-md text-label-md font-semibold text-secondary hover:underline"
        >
          View Matches
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}

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
        {[
          { key: 'available', label: 'Available (matching)', statuses: ['AVAILABLE'], icon: ClipboardList },
          { key: 'accepted', label: 'Accepted (awaiting pickup)', statuses: ['ACCEPTED', 'ASSIGNED'], icon: Package },
          { key: 'transit', label: 'In transit (dispatched)', statuses: ['PICKED_UP'], icon: 'Truck' },
          { key: 'completed', label: 'Completed & verified', statuses: ['COMPLETED'], icon: CheckCircle2 },
          { key: 'closed', label: 'Expired or withdrawn', statuses: ['EXPIRED', 'CANCELLED'], icon: 'XCircle' },
        ].map((row) => {
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

export default function DonationsList() {
  const { user } = useAuth();
  const { error: raiseError } = useToast();

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filter, setFilter] = useState('ACTIVE');

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

  useEffect(() => {
    // Donor can only see their own donations; the API filters by role.
    if (user?.role !== 'DONOR') {
      setDonations([]);
      setLoading(false);
    }
  }, [user?.role]);

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

  const visible = useMemo(
    () =>
      donations.filter((d) =>
        DONATION_TABS.find((tab) => tab.key === filter)?.statuses.includes(d.effectiveStatus)
      ),
    [donations, filter]
  );

  const activeTab = DONATION_TABS.find((tab) => tab.key === filter);

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
          < PlusCircle className="h-4 w-4" aria-hidden="true" />
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
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-8 w-20" /></div>
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-8 w-20" /></div>
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-8 w-20" /></div>
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-8 w-20" /></div>
          </>
        ) : (
          <>
            <Card padding="lg" className="xl:col-span-2">
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-4">Donation Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                    <ClipboardList className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-body-sm text-label-sm uppercase tracking-wider text-secondary">Total Donations</p>
                    <p className="font-title-md text-title-md font-bold text-on-surface">{stats.total}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-body-sm text-label-sm uppercase tracking-wider text-secondary">Active</p>
                    <p className="font-title-md text-title-md font-bold text-secondary">{stats.active}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-body-sm text-label-sm uppercase tracking-wider text-secondary">Completed</p>
                    <p className="font-title-md text-title-md font-bold text-primary">{stats.completed}</p>
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
              {expiringSoon.length > 0 && (
                <Banner variant="warning" title="A donation is nearing its collection deadline">
                  {expiringSoon.length === 1
                    ? `${expiringSoon[0].foodName} expires in ${countdownLabel(expiringSoon[0].expiryTime)}.`
                    : `${expiringSoon.length} donations expire within the next two hours.`}
                </Banner>
              )}

              {recent.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
                    <Inbox className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="font-title-md text-title-md font-semibold text-on-surface">
                    No donations yet
                  </p>
                  <p className="max-w-sm font-body-sm text-body-sm text-on-surface-variant">
                    Publish a surplus batch and its latest activity will appear here.
                  </p>
                  <Button
                    as={Link}
                    to="/donor/donations/new"
                    variant="outline"
                    size="sm"
                    className="mt-1"
                  >
                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                    Create Donation
                  </Button>
                </div>
              ) : (
                recent
                  .slice(0, 3)
                  .map((donation) => <RecentDonationRow key={donation.id} donation={donation} />)
              )}
            </Card>
          </>
        )}
      </section>

      {/* --- All Donations ------------------------------------------------ */}
      <section aria-label="All your donations" className="mt-8">
        <Card padding="lg">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              All Donations
            </h2>
            {loading ? (
              <Badge variant="neutral" size="sm">
                Loading...
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                {donations.length} total
              </Badge>
            )}
          </div>

          {!loading && donations.length > 0 && (
            <div
              role="tablist"
              aria-label="Filter donations by status"
              className="mt-4 flex flex-wrap gap-2"
            >
              {DONATION_TABS.map((tab) => {
                const count = donations.filter((d) =>
                  tab.statuses.includes(d.effectiveStatus)
                ).length;
                const selected = filter === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setFilter(tab.key)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-label-md text-label-md font-semibold transition-colors',
                      selected
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    )}
                  >
                    {tab.label}
                    <span className="rounded-full bg-surface-container-lowest px-1.5 text-label-sm text-outline">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-4 px-4 pb-5 sm:px-5">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : donations.length === 0 ? (
            <EmptyState
              compact
              icon={Inbox}
              title="No Donations Published Yet"
              message="Publish your first surplus batch and the matching engine will find a nearby verified NGO for it."
            >
              <Button as={Link} to="/donor/donations/new" variant="primary">
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Create First Donation
              </Button>
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState
              compact
              icon={Inbox}
              title={`No ${(activeTab?.label || '').toLowerCase()} donations`}
              message="Nothing in this status right now. Switch tabs to see your other donations."
            />
          ) : (
            <ul className="border-t border-outline-variant space-y-3">
              {visible.map((donation) => (
                <li key={donation.id} className="flex flex-col gap-3 border-b border-outline-variant px-4 py-3 last:border-b-0 sm:px-5 sm:py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                        <Utensils className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
                          <Link
                            to={`/donor/donations/${donation.id}`}
                            className="hover:text-primary hover:underline"
                          >
                            {donation.foodName}
                          </Link>
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {formatQuantityWithWeight(donation.quantity, donation.quantityUnit)} ·
                          {donation.foodCategory}
                        </p>
                      </div>
                    </div>

                    <Badge status={donation.effectiveStatus} size="sm" />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-body-sm">
                      <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {donation.effectiveStatus === 'AVAILABLE'
                          ? countdownLabel(donation.expiryTime)
                          : donation.effectiveStatus === 'EXPIRED'
                            ? 'Deadline passed'
                            : `Deadline ${formatDateTime(donation.expiryTime)}`}
                      </span>
                      {donation.matchedNgo && (
                        <span className="text-on-surface-variant">
                          Recipient: <span className="font-semibold">{donation.matchedNgo.organizationName}</span>
                        </span>
                      )}
                      <span className={cn('text-on-surface-variant', statusToneClass(donation.effectiveStatus))}>
                        Status: {donation.effectiveStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Link
                        to={`/donor/donations/${donation.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-label-md text-label-md font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                      >
                        Details
                      </Link>
                      <Link
                        to={`/donor/donations/${donation.id}/matches`}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container-high hover:text-on-surface"
                      >
                        Matches
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {!loading && donations.length > 0 && (
        <p className="font-label-sm text-label-sm text-outline mt-3">
          Showing your active and most recent donations.
        </p>
      )}
    </div>
  );
}