import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  Clock,
  Compass,
  Info,
  Leaf,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  Route,
  ShieldCheck,
  Soup,
  Thermometer,
  Trash2,
  TriangleAlert,
  Utensils,
  Warehouse,
} from 'lucide-react';

import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Modal,
  ModalNote,
  Skeleton,
  useToast,
} from '../../components/ui/index.js';
import { cancelDonation, getMatches } from '../../services/donation.service.js';
import { cn } from '../../utils/cn.js';
import { countdownLabel, formatDateTime, minutesUntil } from '../../utils/datetime.js';
import { formatQuantityWithWeight } from '../../utils/donationFormat.js';

/**
 * MatchingResults — the ranked NGO recommendations for one donation (Step C).
 *
 * Rebuilt from the Stitch Matching Results screen (page 5, shell `web_dashboard`).
 * Everything shown comes from GET /api/matches/:donationId: the score, the four
 * factor percentages, the distance and the explanation are the engine's own
 * output, not recomputed here.
 *
 * The screen's fixed weights ("Storage 98%", "Dietary 96%", "Proximity 94%",
 * "Collection 95%") and its invented telemetry — "Engine Pulse: Active (0.8s
 * cycle)", "Pinged 3m ago", the live engine log and the radius slider — are
 * omitted. There is no realtime feed in the MVP, and the radius is a fixed part
 * of the distance factor, not a user control.
 *
 * The donor may withdraw the donation from here while it is still unclaimed.
 */

const FACTORS = [
  {
    key: 'capacity',
    label: 'Storage Capacity',
    icon: Warehouse,
    weight: 0.3,
    describe: (rec) => `${rec.ngo.storageCapacity} kg/day recorded`,
  },
  {
    key: 'compatibility',
    label: 'Dietary Compatibility',
    icon: Utensils,
    weight: 0.25,
    describe: (rec) => rec.ngo.foodPreference || 'No stated category preference',
  },
  {
    key: 'distance',
    label: 'Proximity & Transit',
    icon: Navigation,
    weight: 0.25,
    describe: (rec) => (rec.distanceKm === null ? 'No location on file' : `${rec.distanceKm} km away`),
  },
  {
    key: 'collection',
    label: 'Collection Window',
    icon: Clock,
    weight: 0.2,
    describe: (rec) => `${countdownLabel(rec.donationExpiry)} to collect`,
  },
];

function scoreVerdict(score) {
  if (score >= 85) return { label: 'Excellent fit', variant: 'positive' };
  if (score >= 70) return { label: 'Strong fit', variant: 'positive' };
  if (score >= 50) return { label: 'Workable fit', variant: 'urgent' };
  return { label: 'Weak fit', variant: 'neutral' };
}

// --- Local pieces -----------------------------------------------------------

function FactorBar({ icon: Icon, label, weight, value, note }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 font-label-md text-label-md text-on-surface">
          <Icon className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
          {label}
          <span className="font-normal text-outline">{Math.round(weight * 100)}%</span>
        </span>
        <span className="font-label-md text-label-md font-semibold text-on-surface">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
        <span
          className={cn('block h-full rounded-full', value >= 70 ? 'bg-secondary' : 'bg-tertiary-fixed-dim')}
          style={{ width: `${value}%` }}
          aria-hidden="true"
        />
      </div>
      <p className="font-body-sm text-[12px] leading-snug text-on-surface-variant">{note}</p>
    </div>
  );
}

function DonationSummary({ donation }) {
  const expired = donation.status !== 'AVAILABLE' || minutesUntil(donation.expiryTime) <= 0;

  return (
    <Card padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary">
            <Soup className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {donation.foodName}
              </h2>
              <Badge status={donation.status} size="sm" />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <Package className="h-4 w-4" aria-hidden="true" />
                {formatQuantityWithWeight(donation.quantity, donation.quantityUnit)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Utensils className="h-4 w-4" aria-hidden="true" />
                {donation.foodCategory}
              </span>
              <span className="inline-flex items-center gap-1.5">
                {donation.foodType === 'VEG' ? (
                  <Leaf className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Utensils className="h-4 w-4" aria-hidden="true" />
                )}
                {donation.foodType === 'VEG' ? 'Vegetarian' : 'Non-vegetarian'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Thermometer className="h-4 w-4" aria-hidden="true" />
                {donation.storageCondition}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {donation.latitude !== null && donation.longitude !== null
                  ? `${donation.latitude}, ${donation.longitude}`
                  : 'No pickup point on file'}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5',
                  expired ? 'text-error' : 'text-secondary'
                )}
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                {expired
                  ? `Deadline ${formatDateTime(donation.expiryTime)}`
                  : `${countdownLabel(donation.expiryTime)} · collect by ${formatDateTime(donation.expiryTime)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {donation.description && (
        <p className="mt-4 rounded-xl bg-surface-container-low p-3 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          {donation.description}
        </p>
      )}
    </Card>
  );
}

function RecommendationCard({ rec, donation }) {
  const isTop = rec.rank === 1;
  const verdict = scoreVerdict(rec.score);
  const withExpiry = { ...rec, donationExpiry: donation.expiryTime };

  return (
    <Card
      padding="lg"
      className={cn(
        'relative flex flex-col gap-5',
        isTop && 'ring-2 ring-secondary shadow-card-hover'
      )}
    >
      {isTop && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 font-label-sm text-label-sm font-semibold text-on-secondary shadow-sm">
          <Award className="h-3.5 w-3.5" aria-hidden="true" />
          Best match
        </span>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-title-md font-bold',
              isTop ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'
            )}
          >
            {rec.rank}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {rec.ngo.organizationName}
              </h3>
              <Badge status={rec.ngo.verificationStatus} size="sm" />
              {rec.matchStatus === 'ACCEPTED' && (
                <Badge status="ACCEPTED" size="sm">
                  Accepted by NGO
                </Badge>
              )}
            </div>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
              {rec.distanceKm !== null ? `${rec.distanceKm} km away` : 'Distance unavailable'} ·{' '}
              {rec.ngo.address}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <Warehouse className="h-4 w-4" aria-hidden="true" />
                {rec.ngo.storageCapacity} kg/day
              </span>
              {rec.ngo.contactName && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {rec.ngo.contactName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-headline-lg font-bold tracking-tight text-primary">
              {Math.round(rec.score)}
            </span>
            <span className="font-title-md text-title-md font-semibold text-on-surface-variant">%</span>
          </div>
          <Badge variant={verdict.variant} size="sm">
            {verdict.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FACTORS.map((factor) => (
          <FactorBar
            key={factor.key}
            icon={factor.icon}
            label={factor.label}
            weight={factor.weight}
            value={rec.breakdown[factor.key]}
            note={factor.describe(withExpiry)}
          />
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-secondary">
          <Route className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-label-md text-label-md font-semibold text-on-surface">Why this match</p>
          <p className="mt-0.5 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            {rec.explanation}
          </p>
        </div>
      </div>
    </Card>
  );
}

// --- Page -------------------------------------------------------------------

export default function MatchingResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: raiseError } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    // /donor/matches has no :id — send the donor to the list instead of
    // requesting /matches/undefined.
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getMatches(id);
      setData(result);
    } catch (apiError) {
      setLoadError(apiError?.message || 'Could not load the matching results.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const donation = data?.donation;
  const recommendations = data?.recommendations || [];
  const canWithdraw = donation?.status === 'AVAILABLE';

  const weightsNote = useMemo(() => {
    if (!data?.weights) return null;
    const { capacity, compatibility, distance, collection } = data.weights;
    return `Capacity ${Math.round(capacity * 100)}% · Compatibility ${Math.round(compatibility * 100)}% · Distance ${Math.round(distance * 100)}% · Collection ${Math.round(collection * 100)}%`;
  }, [data]);

  async function handleWithdraw() {
    setCancelling(true);
    try {
      await cancelDonation(id);
      success('Donation withdrawn.');
      setConfirmOpen(false);
      navigate('/donor');
    } catch (apiError) {
      raiseError(apiError?.message || 'Could not withdraw the donation.');
      setConfirmOpen(false);
    } finally {
      setCancelling(false);
    }
  }

  // --- Missing donation id --------------------------------------------------
  if (!id) return <Navigate to="/donor/donations" replace />;

  // --- Loading --------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col gap-space-lg">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  // --- Error ----------------------------------------------------------------
  if (loadError) {
    return (
      <div className="flex flex-col gap-space-lg">
        <Banner
          variant="error"
          title="We could not load the matching results"
          action={
            <Button size="sm" variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          }
        >
          {loadError}
        </Banner>
        <Button as={Link} to="/donor" variant="ghost" className="self-start">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            Batch #{donation?.id}
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            Matching Results
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Verified, accepting NGOs ranked by capacity, dietary compatibility, distance and the time
            left before collection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button as={Link} to="/donor" variant="ghost" className="shrink-0">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Button>
          {canWithdraw && (
            <Button
              type="button"
              variant="danger"
              onClick={() => setConfirmOpen(true)}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Withdraw Donation
            </Button>
          )}
        </div>
      </header>

      {donation && <DonationSummary donation={donation} />}

      {/* --- Ineligible --------------------------------------------------- */}
      {data && !data.eligible && (
        <Banner
          variant="warning"
          title="This donation cannot be matched right now"
          icon={TriangleAlert}
          action={
            <Button as={Link} to="/donor/donations/new" size="sm" variant="outline">
              <Soup className="h-4 w-4" aria-hidden="true" />
              New donation
            </Button>
          }
        >
          {(data.reasons || []).map((reason) => (
            <span key={reason} className="block">
              {reason}
            </span>
          ))}
        </Banner>
      )}

      {/* --- Recommendations ---------------------------------------------- */}
      {data?.eligible && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Recommended NGOs
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {recommendations.length === 0
                  ? 'No eligible NGO could be ranked for this batch.'
                  : `${recommendations.length} eligible ${recommendations.length === 1 ? 'NGO' : 'NGOs'} found.`}
              </p>
            </div>
            <Badge variant="neutral" size="sm" icon={ShieldCheck}>
              Verified NGOs only
            </Badge>
          </div>

          {recommendations.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No matching NGOs right now"
              message="Every nearby NGO is either unverified, not accepting donations, short on capacity for this batch, or cannot handle this food type. Widen the batch or try again later."
            >
              <Button as={Link} to="/donor/donations/new" variant="primary">
                <Soup className="h-4 w-4" aria-hidden="true" />
                Create another donation
              </Button>
              <Button as={Link} to="/donor" variant="ghost">
                Back to dashboard
              </Button>
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-space-lg">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.matchId ?? rec.ngo.id} rec={rec} donation={donation} />
              ))}
            </div>
          )}

          {/* --- Footnote ------------------------------------------------- */}
          <Card padding="lg" className="bg-surface-container-low">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-secondary">
                <Info className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-label-md text-label-md font-semibold text-on-surface">
                  How the score works
                </p>
                <p className="mt-0.5 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                  The score is an explainable ranking, not a guarantee. {weightsNote}. NGOs that are
                  unverified, not accepting, short on capacity or unable to handle this food type are
                  excluded before scoring.
                </p>
                <p className="mt-2 font-body-sm text-[12px] leading-relaxed text-on-surface-variant">
                  Matching does not certify food safety. Safe handling, storage and hand-off remain the
                  responsibility of the donor and the receiving NGO.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* --- Withdraw confirmation --------------------------------------- */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Withdraw this donation?"
        subtitle="The batch will no longer be offered to NGOs."
        icon={Trash2}
        tone="danger"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
              Keep donation
            </Button>
            <Button type="button" variant="danger" loading={cancelling} onClick={handleWithdraw}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Withdraw
            </Button>
          </>
        }
      >
        <ModalNote>
          <p>
            <strong className="font-semibold">{donation?.foodName}</strong> will be marked cancelled and
            removed from the matching pool. This cannot be undone.
          </p>
        </ModalNote>
      </Modal>

      {canWithdraw && (
        <p className="flex items-center gap-2 font-label-sm text-label-sm text-outline">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          Recommendations refresh automatically as the deadline approaches.
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </p>
      )}
    </div>
  );
}
