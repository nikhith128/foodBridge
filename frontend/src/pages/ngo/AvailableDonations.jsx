import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Inbox,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Store,
  Thermometer,
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
  FilterPills,
  Input,
  Select,
  Skeleton,
  useToast,
} from '../../components/ui/index.js';
import { listDonations } from '../../services/donation.service.js';
import { cn } from '../../utils/cn.js';
import { countdownLabel, minutesUntil } from '../../utils/datetime.js';
import { formatQuantityWithWeight } from '../../utils/donationFormat.js';
import { donorName } from './NgoDashboard.jsx';

/**
 * AvailableDonations — the NGO's browse-and-claim feed (Step D).
 *
 * Rebuilt from the Stitch Available Donations screen (page 9, shell
 * `web_portal_ngo`). The list comes from GET /api/donations, which for an NGO
 * returns only open, unexpired batches and attaches a `forYou` block: the
 * distance, the engine's score for this NGO, and — when it cannot take the batch
 * — the reasons why.
 *
 * The screen's "Live NGO Dispatch Simulator" switcher, the split map view, the
 * offline/cached-mode banner, the "AI Top Dispatch Match" hero and the fake
 * driver ETAs are all omitted: they are Stitch simulation devices, and there is
 * no map or courier feed in the MVP. Filtering and sorting happen on the fetched
 * list, so there is no server round trip per keystroke.
 */

const DIET_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'VEG', label: 'Veg' },
  { value: 'NON_VEG', label: 'Non-Veg' },
];

const SORT_OPTIONS = [
  { value: 'score', label: 'Highest match score' },
  { value: 'distance', label: 'Nearest first' },
  { value: 'expiry', label: 'Expiring soonest' },
  { value: 'newest', label: 'Newest added' },
  { value: 'quantity', label: 'Largest quantity' },
];

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All categories' },
  { value: 'Cooked Hot Meals', label: 'Cooked Hot Meals' },
  { value: 'Fresh Produce', label: 'Fresh Produce' },
  { value: 'Bakery & Bread', label: 'Bakery & Bread' },
  { value: 'Packaged Goods', label: 'Packaged Goods' },
  { value: 'Vegetarian Only', label: 'Vegetarian Only' },
];

function scoreTone(score) {
  if (typeof score !== 'number') return 'neutral';
  if (score >= 85) return 'positive';
  if (score >= 70) return 'positive';
  if (score >= 50) return 'urgent';
  return 'neutral';
}

function BatchCard({ donation }) {
  const fit = donation.forYou;
  const minutes = minutesUntil(donation.expiryTime);
  const urgent = minutes > 0 && minutes <= 60;

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary">
            <Utensils className="h-5 w-5" aria-hidden="true" />
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
          {typeof fit?.score === 'number' ? (
            <div className="flex items-baseline gap-1">
              <span className="font-display text-headline-md font-bold tracking-tight text-primary">
                {Math.round(fit.score)}
              </span>
              <span className="font-label-md text-label-md font-semibold text-on-surface-variant">
                % fit
              </span>
            </div>
          ) : (
            <Badge variant="neutral" size="sm">
              Not a fit
            </Badge>
          )}
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
          {typeof fit?.distanceKm === 'number' ? `${fit.distanceKm} km away` : 'Distance unavailable'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Thermometer className="h-4 w-4" aria-hidden="true" />
          {donation.storageCondition}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 sm:col-span-2',
            urgent ? 'font-semibold text-error' : 'text-secondary'
          )}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          {countdownLabel(donation.expiryTime)} to collect
        </span>
      </div>

      {fit && !fit.eligible && fit.reasons?.length > 0 && (
        <p className="rounded-xl bg-surface-container-low p-3 font-body-sm text-body-sm text-on-surface-variant">
          You are not currently a match for this batch: {fit.reasons.join(' ')}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button as={Link} to={`/ngo/donations/${donation.id}`} variant="ghost" size="sm">
          Details
        </Button>
        <Button as={Link} to={`/ngo/donations/${donation.id}`} variant="primary" size="sm">
          Review &amp; Accept
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
}

export default function AvailableDonations() {
  const { error: raiseError } = useToast();

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [query, setQuery] = useState('');
  const [diet, setDiet] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [sort, setSort] = useState('score');
  const [urgentOnly, setUrgentOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listDonations();
      setDonations(data.donations || []);
    } catch (apiError) {
      const message = apiError?.message || 'Could not load available donations.';
      setLoadError(message);
      raiseError(message);
    } finally {
      setLoading(false);
    }
  }, [raiseError]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = donations.filter((d) => {
      if (diet !== 'ALL' && d.foodType !== diet) return false;
      if (category !== 'ALL' && d.foodCategory !== category) return false;
      if (urgentOnly) {
        const minutes = minutesUntil(d.expiryTime);
        if (minutes <= 0 || minutes > 60) return false;
      }
      if (!needle) return true;
      const haystack = [d.foodName, donorName(d), d.foodCategory, `#${d.id}`]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });

    const byScore = (d) => (typeof d.forYou?.score === 'number' ? d.forYou.score : -1);
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'distance') {
        return (a.forYou?.distanceKm ?? Infinity) - (b.forYou?.distanceKm ?? Infinity);
      }
      if (sort === 'expiry') {
        return new Date(a.expiryTime).getTime() - new Date(b.expiryTime).getTime();
      }
      if (sort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === 'quantity') {
        return Number(b.quantity) - Number(a.quantity);
      }
      // score (default): eligible first, then highest score, then nearest.
      const eligibleDelta = Number(Boolean(b.forYou?.eligible)) - Number(Boolean(a.forYou?.eligible));
      if (eligibleDelta !== 0) return eligibleDelta;
      if (byScore(b) !== byScore(a)) return byScore(b) - byScore(a);
      return (a.forYou?.distanceKm ?? Infinity) - (b.forYou?.distanceKm ?? Infinity);
    });

    return sorted;
  }, [donations, query, diet, category, sort, urgentOnly]);

  const urgentCount = useMemo(
    () => donations.filter((d) => minutesUntil(d.expiryTime) <= 60).length,
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
            Available Surplus Food Batches
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Browse and claim open surplus batches. Each one is scored for your capacity, dietary
            profile and location.
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
          title="We could not load the available batches"
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

      {/* --- Filters ------------------------------------------------------ */}
      <Card padding="lg" className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Search"
            name="donation-search"
            placeholder="Dish, donor or batch #"
            leadingIcon={Search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            label="Category"
            name="category-filter"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
          <Select
            label="Sort by"
            name="sort-filter"
            options={SORT_OPTIONS}
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <span className="font-label-md text-label-md text-on-surface">Dietary</span>
            <FilterPills
              items={DIET_FILTERS}
              value={diet}
              onChange={setDiet}
              ariaLabel="Dietary filter"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterPills
            items={[{ value: 'urgent', label: `Urgent only (${urgentCount})` }]}
            multiple
            value={urgentOnly ? ['urgent'] : []}
            onChange={(values) => setUrgentOnly(values.includes('urgent'))}
            ariaLabel="Urgent filter"
          />
          {!loading && (
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Showing <span className="font-semibold text-on-surface">{visible.length}</span> of{' '}
              {donations.length} available {donations.length === 1 ? 'batch' : 'batches'}
            </p>
          )}
        </div>
      </Card>

      {/* --- List --------------------------------------------------------- */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : donations.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No surplus batches available right now"
          message="Every open batch has been claimed or has passed its collection deadline. New surplus appears here the moment a donor publishes it."
        >
          <Button type="button" variant="primary" onClick={load}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No batches match your filters"
          message="Nothing in the current list fits the search, dietary and category filters you have applied."
        >
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setQuery('');
              setDiet('ALL');
              setCategory('ALL');
              setUrgentOnly(false);
            }}
          >
            Reset filters
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible.map((donation) => (
            <BatchCard key={donation.id} donation={donation} />
          ))}
        </div>
      )}
    </div>
  );
}
