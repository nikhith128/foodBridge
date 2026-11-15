import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Info,
  MapPin,
  RefreshCw,
  ShieldCheck,
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
  StepTracker,
} from '../../components/ui/index.js';
import { getDonation, listDonations } from '../../services/donation.service.js';
import { countdownLabel, formatDateTime } from '../../utils/datetime.js';
import { formatQuantityWithWeight } from '../../utils/donationFormat.js';

/**
 * PickupDetails (donor) — page 12.
 *
 * The donor API exposes the recipient on the donation (`matchedNgo`) but not the
 * NGO's pickup row, so this route is keyed by the donation id and the timeline
 * is derived from the donation's own status. No GPS breadcrumb, ETA or driver
 * name is shown, because the backend has no realtime feed to supply one.
 *
 * `/donor/pickups` without an id lists the donor's claimed batches, which is
 * where the sidebar's "Pickup Details" link lands.
 */

const STAGE_BY_STATUS = {
  AVAILABLE: 0,
  ACCEPTED: 1,
  ASSIGNED: 1,
  PICKED_UP: 2,
  COMPLETED: 3,
  EXPIRED: 0,
  CANCELLED: 0,
};

function trackerSteps(donation) {
  const stage = STAGE_BY_STATUS[donation.effectiveStatus] ?? 0;
  const closed = donation.effectiveStatus === 'EXPIRED' || donation.effectiveStatus === 'CANCELLED';

  const stateAt = (index) => {
    if (closed) return index === 0 ? 'done' : 'upcoming';
    if (stage === 3) return 'done';
    if (index < stage) return 'done';
    if (index === stage) return 'active';
    return 'upcoming';
  };

  return [
    {
      title: 'Published',
      meta: formatDateTime(donation.createdAt),
      status: stateAt(0),
    },
    {
      title: 'NGO accepted',
      meta: donation.matchedNgo?.organizationName || 'Waiting for an NGO',
      status: stateAt(1),
    },
    {
      title: 'Collected',
      meta: stage >= 2 ? 'Recorded by the receiving NGO' : 'Not collected yet',
      status: stateAt(2),
    },
    {
      title: 'Delivered',
      meta: stage >= 3 ? 'Rescue complete' : 'Confirmed by the receiving NGO',
      status: stateAt(3),
    },
  ];
}

function PickupIndex() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listDonations();
      const claimed = (data.donations || [])
        .filter((donation) => donation.matchedNgo)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDonations(claimed);
    } catch (apiError) {
      setLoadError(apiError?.message || 'Could not load your pickups.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-space-lg">
      <header>
        <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
          Collection tracking
        </p>
        <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
          Pickup Details
        </h1>
        <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Batches an NGO has accepted. Open one to see how far its collection has progressed.
        </p>
      </header>

      {loadError && (
        <Banner
          variant="error"
          title="We could not load your pickups"
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

      <Card padding="lg">
        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : donations.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No pickups yet"
            message="Once an NGO accepts one of your donations it appears here with its collection progress."
          >
            <Button as={Link} to="/donor/donations" variant="primary">
              View My Donations
            </Button>
          </EmptyState>
        ) : (
          <ul className="border-t border-outline-variant">
            {donations.map((donation) => (
              <li
                key={donation.id}
                className="border-b border-outline-variant px-1 py-4 last:border-b-0"
              >
                <Link
                  to={`/donor/pickups/${donation.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-surface-container-low"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                      <Truck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
                        {donation.foodName}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {donation.matchedNgo.organizationName} ·{' '}
                        {formatQuantityWithWeight(donation.quantity, donation.quantityUnit)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge status={donation.effectiveStatus} size="sm" />
                    <ArrowRight className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function PickupTracking({ id }) {
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getDonation(id);
      setDonation(data.donation);
    } catch (apiError) {
      setLoadError(apiError?.message || 'Could not load this pickup.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col gap-space-lg">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (loadError || !donation) {
    return (
      <div className="flex flex-col gap-space-lg">
        <Banner
          variant="error"
          title="We could not load this pickup"
          action={
            <Button size="sm" variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          }
        >
          {loadError || 'The pickup could not be found.'}
        </Banner>
        <Button as={Link} to="/donor/pickups" variant="ghost" className="self-start">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All pickups
        </Button>
      </div>
    );
  }

  const expired = donation.effectiveStatus === 'EXPIRED';
  const cancelled = donation.effectiveStatus === 'CANCELLED';

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3">
        <Button as={Link} to="/donor/pickups" variant="ghost" size="sm" className="self-start">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All pickups
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary">
              <Truck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                Batch #{donation.id}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
                  {donation.foodName}
                </h1>
                <Badge status={donation.effectiveStatus} size="sm" />
              </div>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                {formatQuantityWithWeight(donation.quantity, donation.quantityUnit)} ·{' '}
                {donation.foodCategory}
              </p>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1.5 font-label-md text-label-md font-semibold text-on-surface">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {donation.status === 'AVAILABLE'
              ? countdownLabel(donation.expiryTime)
              : `Deadline ${formatDateTime(donation.expiryTime)}`}
          </span>
        </div>
      </header>

      {(expired || cancelled) && (
        <Banner
          variant="warning"
          title={expired ? 'The collection deadline passed' : 'This batch was withdrawn'}
        >
          {expired
            ? 'No NGO collected this batch before its safe collection deadline.'
            : 'You withdrew this batch, so no pickup was scheduled.'}
        </Banner>
      )}

      {/* --- Progress ------------------------------------------------------ */}
      <Card padding="lg" className="flex flex-col gap-5">
        <div>
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Pickup Progress
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Each step is recorded by the receiving NGO from Pickup Management.
          </p>
        </div>

        <StepTracker steps={trackerSteps(donation)} columns={4} />

        <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-secondary">
            <Info className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="font-body-sm text-[12px] leading-relaxed text-on-surface-variant">
            Live driver location and ETA are not part of the MVP. Contact the receiving
            organisation directly if you need an update during collection.
          </p>
        </div>
      </Card>

      {/* --- Assigned organisation ---------------------------------------- */}
      <Card padding="lg" className="flex flex-col gap-4">
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          Assigned Organisation
        </h2>

        {donation.matchedNgo ? (
          <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4">
            <p className="flex items-center gap-2 font-title-md text-title-md font-semibold text-on-surface">
              <Utensils className="h-4 w-4 text-primary" aria-hidden="true" />
              {donation.matchedNgo.organizationName}
            </p>
            {donation.matchedNgo.address && (
              <p className="flex items-start gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {donation.matchedNgo.address}
              </p>
            )}
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Collection deadline:{' '}
              <span className="font-semibold text-on-surface">
                {formatDateTime(donation.expiryTime, { withYear: true })}
              </span>
            </p>
          </div>
        ) : (
          <p className="rounded-xl bg-surface-container-low p-4 font-body-sm text-body-sm text-on-surface-variant">
            No NGO has accepted this batch yet, so no pickup is scheduled.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button as={Link} to={`/donor/donations/${donation.id}`} variant="outline">
            Open Donation Details
          </Button>
          <Button as={Link} to="/donor/donations" variant="ghost">
            My Donations
          </Button>
        </div>
      </Card>

      <p className="flex items-center gap-2 font-label-sm text-label-sm text-outline">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Matching does not certify food safety.
      </p>
    </div>
  );
}

export default function PickupDetails() {
  const { id } = useParams();
  return id ? <PickupTracking id={id} /> : <PickupIndex />;
}
