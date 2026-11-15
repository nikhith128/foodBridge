import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Info,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
  TriangleAlert,
  Utensils,
} from 'lucide-react';

import {
  Badge,
  Banner,
  Button,
  Card,
  DietBadge,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui/index.js';
import { listDonations } from '../../services/donation.service.js';
import { cn } from '../../utils/cn.js';
import { countdownLabel, minutesUntil } from '../../utils/datetime.js';
import { formatQuantityWithWeight } from '../../utils/donationFormat.js';
import { donorName } from './NgoDashboard.jsx';

/**
 * MatchingRecommendations — page 17.
 *
 * There is no NGO-wide recommendation endpoint in Architecture.md section 8, and
 * inventing one would mean inventing scores. GET /api/donations already returns
 * every open batch with a `forYou` block computed for this NGO (score, distance,
 * eligibility, explanation), so this page is that feed filtered to eligible
 * batches and ordered by score.
 *
 * Ineligible batches are counted and explained rather than hidden, because "why
 * can I not take this?" is the question the page exists to answer.
 */

const FACTOR_WEIGHTS = [
  { label: 'Capacity', weight: 30 },
  { label: 'Compatibility', weight: 25 },
  { label: 'Distance', weight: 25 },
  { label: 'Collection time', weight: 20 },
];

function RecommendationCard({ donation, rank }) {
  const fit = donation.forYou;
  const minutes = minutesUntil(donation.expiryTime);
  const urgent = minutes > 0 && minutes <= 60;

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-container font-display text-title-md font-bold text-on-primary">
            {rank}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {donation.foodName}
              </h3>
              <DietBadge vegetarian={donation.foodType === 'VEG'} />
            </div>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
              Batch #{donation.id} · {donation.foodCategory}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-headline-md font-bold tracking-tight text-primary">
              {Math.round(fit.score)}
            </span>
            <span className="font-label-md text-label-md font-semibold text-on-surface-variant">
              % fit
            </span>
          </div>
          {urgent && (
            <Badge variant="urgent" size="sm" icon={TriangleAlert}>
              Urgent
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-2 font-body-sm text-body-sm text-on-surface-variant sm:grid-cols-2">
        <span className="inline-flex items-center gap-1.5">
          <Package className="h-4 w-4" aria-hidden="true" />
          {formatQuantityWithWeight(donation.quantity, donation.quantityUnit)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Store className="h-4 w-4" aria-hidden="true" />
          {donorName(donation)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {typeof fit.distanceKm === 'number' ? `${fit.distanceKm} km away` : 'Distance unavailable'}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5',
            urgent ? 'font-semibold text-error' : 'text-secondary'
          )}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          {countdownLabel(donation.expiryTime)} to collect
        </span>
      </div>

      {fit.explanation && (
        <p className="rounded-xl bg-surface-container-low p-3 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          {fit.explanation}
        </p>
      )}

      <Button as={Link} to={`/ngo/donations/${donation.id}`} variant="primary" size="sm">
        Review &amp; Accept
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </Card>
  );
}

export default function MatchingRecommendations() {
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
      const message = apiError?.message || 'Could not load your recommendations.';
      setLoadError(message);
      raiseError(message);
    } finally {
      setLoading(false);
    }
  }, [raiseError]);

  useEffect(() => {
    load();
  }, [load]);

  const ranked = useMemo(
    () =>
      donations
        .filter((d) => d.forYou?.eligible && typeof d.forYou.score === 'number')
        .sort((a, b) => b.forYou.score - a.forYou.score),
    [donations]
  );

  const excluded = useMemo(
    () => donations.filter((d) => d.forYou && !d.forYou.eligible),
    [donations]
  );

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            NGO Portal
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            Matching Recommendations
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Open batches scored for your capacity, dietary profile and location, best first.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={load} className="shrink-0" disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
          Refresh
        </Button>
      </header>

      {loadError && (
        <Banner
          variant="error"
          title="We could not load your recommendations"
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

      {/* --- Ranked list -------------------------------------------------- */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : ranked.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations right now"
          message="No open batch currently fits your capacity, dietary preference, storage and location. New surplus appears here as donors publish it."
        >
          <Button as={Link} to="/ngo/donations" variant="primary">
            <Utensils className="h-4 w-4" aria-hidden="true" />
            Browse all available batches
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">{ranked.length}</span>{' '}
              {ranked.length === 1 ? 'batch matches' : 'batches match'} your intake profile.
            </p>
            <Badge variant="neutral" size="sm">
              Sorted by match score
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {ranked.map((donation, index) => (
              <RecommendationCard key={donation.id} donation={donation} rank={index + 1} />
            ))}
          </div>
        </>
      )}

      {/* --- Excluded batches --------------------------------------------- */}
      {!loading && excluded.length > 0 && (
        <Card padding="lg" className="flex flex-col gap-3 bg-surface-container-low">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-on-surface-variant" aria-hidden="true" />
            <h2 className="font-title-md text-title-md font-semibold text-on-surface">
              {excluded.length} open {excluded.length === 1 ? 'batch is' : 'batches are'} not a match
            </h2>
          </div>
          <ul className="flex flex-col gap-2">
            {excluded.map((donation) => (
              <li key={donation.id} className="font-body-sm text-body-sm text-on-surface-variant">
                <Link
                  to={`/ngo/donations/${donation.id}`}
                  className="font-semibold text-on-surface hover:text-primary hover:underline"
                >
                  {donation.foodName}
                </Link>{' '}
                — {(donation.forYou.reasons || []).join(' ') || 'Outside your intake profile.'}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* --- How the score works ------------------------------------------ */}
      <Card padding="lg" className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-secondary">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-title-md text-title-md font-semibold text-on-surface">
              How the score works
            </h2>
            <p className="mt-0.5 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
              The engine weights four factors: capacity 30%, food compatibility 25%, distance 25%
              and collection time 20%. The result is an explainable ranking, not a guarantee.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FACTOR_WEIGHTS.map((factor) => (
            <span
              key={factor.label}
              className="rounded-full bg-surface-container-low px-3 py-1 font-label-sm text-label-sm text-on-surface-variant"
            >
              {factor.label} {factor.weight}%
            </span>
          ))}
        </div>

        <p className="font-body-sm text-[12px] leading-relaxed text-on-surface-variant">
          Matching does not certify food safety. Your coordinators must perform an on-site sensory
          and thermal check before admitting any batch into distribution.
        </p>
      </Card>
    </div>
  );
}
