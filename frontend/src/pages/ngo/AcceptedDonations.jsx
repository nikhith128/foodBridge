import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Heart,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  Utensils,
} from 'lucide-react';

import { Badge, Banner, Button, Card, EmptyState, useToast } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { listDonations } from '../../services/donation.service.js';
import { cn } from '../../utils/cn.js';
import { countdownLabel, formatDateTime, isPast, minutesUntil } from '../../utils/datetime.js';
import {
  estimateMeals,
  formatQuantityWithWeight,
} from '../../utils/donationFormat.js';

function statusToneClass(status) {
  if (status === 'AVAILABLE') return 'text-secondary';
  if (status === 'COMPLETED') return 'text-primary';
  if (status === 'EXPIRED' || status === 'CANCELLED') return 'text-outline';
  return 'text-on-surface-variant';
}

function AcceptedDonationRow({ donation }) {
  const minutes = minutesUntil(donation.expiryTime);
  const expired = donation.effectiveStatus === 'EXPIRED' || minutes <= 0;
  const isInTransit =
    donation.effectiveStatus === 'PICKED_UP' ||
    donation.effectiveStatus === 'ASSIGNED' ||
    donation.effectiveStatus === 'ACCEPTED';

  return (
    <li className="flex flex-col gap-3 border-b border-outline-variant px-4 py-4 last:border-b-0 sm:px-5 sm:py-3">
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
              <Strong>Recipient:</Strong> <span className="font-semibold">{donation.matchedNgo?.organizationName || '—'}</span>
            </span>
          )}
          <span className={cn('text-on-surface-variant', statusToneClass(donation.effectiveStatus))}>
            {expired ? formatDateTime(donation.expiryTime) : `Deadline ${formatDateTime(donation.expiryTime)}`}
          </span>
        </div>

        {isInTransit ? (
          <span className="text-on-surface-variant">
            <Strong>In transit</Strong>
          </span>
        ) : (
          <Link
            to={`/ngo/donations/${donation.id}`}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container-high hover:text-on-surface"
          >
            View Details
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </div>
    </li>
  );
}

export default function AcceptedDonations() {
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
      // Filter to only ACCEPTED donations for this NGO
      setDonations((data.donations || []).filter(
        (d) => d.effectiveStatus === 'ACCEPTED' && d.matchedNgo?.id
      ));
    } catch (apiError) {
      setLoadError(apiError?.message || 'Could not load your accepted donations.');
      raiseError(apiError?.message || 'Could not load your accepted donations.');
    } finally {
      setLoading(false);
    }
  }, [raiseError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // NGO can only see their own accepted donations
    if (user?.role !== 'NGO') {
      setDonations([]);
      setLoading(false);
    }
  }, [user?.role]);

  const stats = useMemo(() => {
    const accepted = donations.filter(
      (d) => d.effectiveStatus === 'ACCEPTED' || d.effectiveStatus === 'ASSIGNED'
    );
    const inTransit = donations.filter(
      (d) => d.effectiveStatus === 'PICKED_UP' || d.effectiveStatus === 'ASSIGNED'
    );
    const completed = donations.filter((d) => d.effectiveStatus === 'COMPLETED');

    return {
      total: donations.length,
      accepted: accepted.length,
      inTransit: inTransit.length,
      completed: completed.length,
      meals: completed.reduce(
        (sum, d) => sum + estimateMeals(d.quantity, d.quantityUnit),
        0
      ),
    };
  }, [donations]);

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
            Your accepted and in-transit donations.
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
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-4">Donation Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                    <Package className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-body-sm text-label-sm uppercase tracking-wider text-secondary">Total Accepted</p>
                    <p className="font-title-md text-title-md font-bold text-primary">{stats.accepted}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                    <Truck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-body-sm text-label-sm uppercase tracking-wider text-secondary">In Transit</p>
                    <p className="font-title-md text-title-md font-bold text-primary">{stats.inTransit}</p>
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
          ) : donations.length === 0 ? (
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
              {donations.map((donation) => (
                <AcceptedDonationRow key={donation.id} donation={donation} />
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}