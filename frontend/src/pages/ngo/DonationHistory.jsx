import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  History,
  Inbox,
  Package,
  RefreshCw,
  Store,
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
import { StatCard } from '../../components/shared/index.js';
import { listPickups } from '../../services/pickup.service.js';
import { formatDateTime } from '../../utils/datetime.js';
import {
  estimateMeals,
  formatQuantityWithWeight,
  toKilograms,
} from '../../utils/donationFormat.js';
import { donorName } from './NgoDashboard.jsx';

/**
 * DonationHistory — page 20.
 *
 * History is the NGO's completed pickups: GET /api/pickups returns every pickup
 * this NGO owns with its donation, donor and delivery timestamp, and COMPLETED
 * is the terminal status. The Stitch screen's ESG certificate, CSV/PDF export,
 * chain-of-custody ledger and 2024-2025 demo totals are not reproduced: there is
 * no export or certificate endpoint, and the figures here are real counts, not
 * the screen's sample numbers.
 */

export default function DonationHistory() {
  const { error: raiseError } = useToast();

  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listPickups({ status: 'COMPLETED' });
      setPickups(data.pickups || []);
    } catch (apiError) {
      const message = apiError?.message || 'Could not load your donation history.';
      setLoadError(message);
      raiseError(message);
    } finally {
      setLoading(false);
    }
  }, [raiseError]);

  useEffect(() => {
    load();
  }, [load]);

  const completed = useMemo(
    () =>
      [...pickups].sort((a, b) => {
        const left = new Date(a.deliveryTime || a.createdAt).getTime();
        const right = new Date(b.deliveryTime || b.createdAt).getTime();
        return right - left;
      }),
    [pickups]
  );

  const stats = useMemo(() => {
    const kilograms = completed.reduce(
      (sum, pickup) =>
        sum + toKilograms(pickup.donation?.quantity, pickup.donation?.quantityUnit),
      0
    );
    const meals = completed.reduce(
      (sum, pickup) =>
        sum + estimateMeals(pickup.donation?.quantity, pickup.donation?.quantityUnit),
      0
    );
    const donors = new Set(
      completed.map((pickup) => donorName(pickup.donation)).filter((name) => name !== 'A donor')
    );

    return {
      batches: completed.length,
      kilograms: Math.round(kilograms),
      meals,
      donors: donors.size,
    };
  }, [completed]);

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            NGO Portal
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            Donation History
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Every batch your organisation has collected and delivered, newest rescue first.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={load} className="shrink-0" disabled={loading}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </header>

      {loadError && (
        <Banner
          variant="error"
          title="We could not load your donation history"
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

      {/* --- Summary ------------------------------------------------------ */}
      <section aria-label="History summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-8 w-20" /></div>
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-8 w-20" /></div>
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-8 w-20" /></div>
            <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-8 w-20" /></div>
          </>
        ) : (
          <>
            <StatCard
              label="Completed collections"
              icon={CheckCircle2}
              value={stats.batches}
              unit="batches"
              accent
              footer={<span>Delivered to your kitchen</span>}
            />
            <StatCard
              label="Food rescued"
              icon={Package}
              tone="secondary"
              value={stats.kilograms}
              unit="kg"
              footer={<span>Across completed batches</span>}
            />
            <StatCard
              label="Meals served"
              icon={Utensils}
              value={stats.meals}
              unit="meals"
              footer={<span className="italic">Estimated from weight</span>}
            />
            <StatCard
              label="Partner donors"
              icon={Store}
              tone="secondary"
              value={stats.donors}
              unit="donors"
              footer={<span>With at least one completed rescue</span>}
            />
          </>
        )}
      </section>

      {/* --- Completed list ----------------------------------------------- */}
      <Card padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Completed Rescues
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              The permanent record of batches you distributed.
            </p>
          </div>
          {!loading && (
            <Badge variant="neutral" size="sm">
              {completed.length} total
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="mt-4 flex flex-col gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : completed.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={History}
              title="No completed rescues yet"
              message="Once you confirm delivery of a collected batch it is preserved here as part of your permanent rescue record."
            >
              <Button as={Link} to="/ngo/pickups" variant="primary">
                <Inbox className="h-4 w-4" aria-hidden="true" />
                Open Pickup Management
              </Button>
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-4 border-t border-outline-variant">
            {completed.map((pickup) => (
              <li
                key={pickup.id}
                className="flex flex-col gap-3 border-b border-outline-variant px-1 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
                      {pickup.donation?.foodName || `Batch #${pickup.donation?.id}`}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {donorName(pickup.donation)} ·{' '}
                      {formatQuantityWithWeight(
                        pickup.donation?.quantity,
                        pickup.donation?.quantityUnit
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <Badge status="COMPLETED" size="sm" />
                    <p className="mt-1 font-label-sm text-label-sm text-outline">
                      {pickup.deliveryTime
                        ? `Delivered ${formatDateTime(pickup.deliveryTime, { withYear: true })}`
                        : 'Delivery recorded'}
                    </p>
                  </div>
                  <Link
                    to={`/ngo/donations/${pickup.donation?.id}`}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container-high hover:text-on-surface"
                  >
                    View batch
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="font-label-sm text-label-sm text-outline">
        Figures are computed from your completed pickups. Meals are an estimate, not a certified
        count.
      </p>
    </div>
  );
}
