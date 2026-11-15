import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Inbox,
  MapPin,
  Package,
  RefreshCw,
  Store,
  Thermometer,
  Truck,
  Utensils,
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
  StepTracker,
  Tabs,
  useToast,
} from '../../components/ui/index.js';
import { listPickups, updatePickupStatus } from '../../services/pickup.service.js';
import { cn } from '../../utils/cn.js';
import { countdownLabel, formatDateTime } from '../../utils/datetime.js';
import { formatQuantityWithWeight } from '../../utils/donationFormat.js';
import {
  PICKUP_STEPS,
  nextPickupStep,
  pickupStageIndex,
  pickupStep,
} from '../../utils/pickupFormat.js';
import { donorName } from './NgoDashboard.jsx';

/**
 * PickupManagement — the NGO's collections board (Step D).
 *
 * Rebuilt from the Stitch Pickup Management screen (page 11, shell
 * `web_portal_ngo`). The list is GET /api/pickups, which returns every pickup
 * this NGO owns with the donation and donor attached. The two actions advance a
 * pickup one legal step each — PENDING -> PICKED_UP -> COMPLETED — through
 * PATCH /api/pickups/:id/status; the server refuses anything else with a 409, so
 * the UI only ever offers the single next move.
 *
 * The screen's "Simulation Sandbox" state switcher, the live GPS/thermal
 * telemetry panels, the courier roster and "Assign Courier" flow, the OTP
 * verification, the delivery-receipt form (servings received, gate thermometer,
 * condition radios) and the chain-of-custody log are all omitted: they describe
 * the deferred volunteer/courier module, and there is no data behind them in the
 * MVP. Collection and delivery are recorded as timestamps, nothing more.
 */

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Awaiting' },
  { value: 'PICKED_UP', label: 'Collected' },
  { value: 'COMPLETED', label: 'Delivered' },
];

/** Map a pickup status onto the three-step tracker's done/active/upcoming. */
function trackerSteps(pickup) {
  const stage = pickupStageIndex(pickup.status);

  return PICKUP_STEPS.map((step, index) => ({
    key: step.status,
    title: step.label,
    status: index < stage || pickup.status === 'COMPLETED' ? 'done' : index === stage ? 'active' : 'upcoming',
    meta:
      step.status === 'PENDING'
        ? `Accepted ${formatDateTime(pickup.createdAt)}`
        : step.status === 'PICKED_UP'
          ? pickup.pickupTime
            ? `Collected ${formatDateTime(pickup.pickupTime)}`
            : 'Not collected yet'
          : pickup.deliveryTime
            ? `Delivered ${formatDateTime(pickup.deliveryTime)}`
            : 'Not delivered yet',
  }));
}

function PickupCard({ pickup, onAdvance }) {
  const donation = pickup.donation;
  const step = pickupStep(pickup.status);
  const next = nextPickupStep(pickup.status);
  const open = Boolean(next);

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      {/* --- Batch header ------------------------------------------------ */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary">
            <Utensils className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Batch #{donation?.id}
            </p>
            <h3 className="mt-0.5 font-headline-sm text-headline-sm font-semibold text-on-surface">
              {donation?.foodName}
            </h3>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
              {donorName(donation)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge status={pickup.status} size="sm" />
          {open && donation?.expiryTime && (
            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {countdownLabel(donation.expiryTime)} to collect
            </span>
          )}
        </div>
      </div>

      {/* --- Manifest line ---------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-body-sm text-body-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5">
          <Package className="h-4 w-4" aria-hidden="true" />
          {formatQuantityWithWeight(donation?.quantity, donation?.quantityUnit)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Thermometer className="h-4 w-4" aria-hidden="true" />
          {donation?.storageCondition}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Store className="h-4 w-4" aria-hidden="true" />
          {donation?.donor?.donorType || 'Donor'}
        </span>
        {donation?.latitude !== null && donation?.latitude !== undefined && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {donation.latitude}, {donation.longitude}
          </span>
        )}
      </div>

      {/* --- Step tracker ----------------------------------------------- */}
      <div className="rounded-xl bg-surface-container-low p-3">
        <StepTracker steps={trackerSteps(pickup)} columns={3} />
      </div>

      {/* --- Help + actions --------------------------------------------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {step?.help}
          {pickup.pickupTime && (
            <>
              {' '}
              Collected <span className="font-semibold text-on-surface">{formatDateTime(pickup.pickupTime)}</span>.
            </>
          )}
          {pickup.deliveryTime && (
            <>
              {' '}
              Delivered{' '}
              <span className="font-semibold text-on-surface">{formatDateTime(pickup.deliveryTime)}</span>.
            </>
          )}
        </p>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button as={Link} to={`/ngo/donations/${donation?.id}`} variant="ghost" size="sm">
            View batch
          </Button>
          {next && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onAdvance(pickup, next)}
            >
              {next.next === 'PICKED_UP' ? (
                <Truck className="h-4 w-4" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              {next.cta}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function PickupManagement() {
  const { success, error: raiseError } = useToast();

  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState('all');
  const [confirm, setConfirm] = useState(null); // { pickup, next }
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listPickups();
      setPickups(data.pickups || []);
    } catch (apiError) {
      const message = apiError?.message || 'Could not load your pickups.';
      setLoadError(message);
      raiseError(message);
    } finally {
      setLoading(false);
    }
  }, [raiseError]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: pickups.length,
      PENDING: pickups.filter((p) => p.status === 'PENDING').length,
      PICKED_UP: pickups.filter((p) => p.status === 'PICKED_UP').length,
      COMPLETED: pickups.filter((p) => p.status === 'COMPLETED').length,
    }),
    [pickups]
  );

  const visible = useMemo(
    () =>
      tab === 'all'
        ? pickups
        : pickups.filter((p) => p.status === tab),
    [pickups, tab]
  );

  const tabs = useMemo(
    () => TABS.map((entry) => ({ ...entry, count: counts[entry.value] ?? 0 })),
    [counts]
  );

  async function handleConfirm() {
    if (!confirm) return;
    setWorking(true);
    try {
      const data = await updatePickupStatus(confirm.pickup.id, confirm.next.next);
      success(
        confirm.next.next === 'PICKED_UP'
          ? 'Pickup recorded. Confirm the delivery once the food reaches your kitchen.'
          : 'Delivery confirmed. Thank you for rescuing this batch.'
      );
      setConfirm(null);
      // Patch the row in place, then refresh so the tracker and the donation
      // status reflect the server's answer.
      setPickups((current) =>
        current.map((p) => (p.id === data.pickup.id ? data.pickup : p))
      );
      load();
    } catch (apiError) {
      raiseError(apiError?.message || 'Could not update this pickup.');
      setConfirm(null);
      // A 409 means the row moved on elsewhere; reload to show the truth.
      load();
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            NGO Portal
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            Pickup Management
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Record the collection and delivery of every batch your organisation has accepted.
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

      {/* --- Tabs --------------------------------------------------------- */}
      <Tabs items={tabs} value={tab} onChange={setTab} ariaLabel="Pickup status" />

      {/* --- List --------------------------------------------------------- */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : pickups.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No pickups yet"
          message="Accept a batch from Available Donations and it will appear here so you can record the collection and the delivery."
        >
          <Button as={Link} to="/ngo/donations" variant="primary">
            <Inbox className="h-4 w-4" aria-hidden="true" />
            Browse available donations
          </Button>
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          icon={ClipboardCheck}
          title="Nothing in this stage"
          message="No pickups currently sit in the stage you selected. Switch back to All to see every collection."
        >
          <Button type="button" variant="primary" onClick={() => setTab('all')}>
            Show all pickups
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visible.map((pickup) => (
            <PickupCard
              key={pickup.id}
              pickup={pickup}
              onAdvance={(row, next) => setConfirm({ pickup: row, next })}
            />
          ))}
        </div>
      )}

      {/* --- Confirm transition ------------------------------------------- */}
      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.next.next === 'PICKED_UP' ? 'Mark this batch as picked up?' : 'Confirm delivery?'}
        subtitle={
          confirm ? `Batch #${confirm.pickup.donation?.id} · ${confirm.pickup.donation?.foodName}` : ''
        }
        icon={confirm?.next.next === 'PICKED_UP' ? Truck : CheckCircle2}
        tone="positive"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" loading={working} onClick={handleConfirm}>
              {confirm?.next.next === 'PICKED_UP' ? (
                <Truck className="h-4 w-4" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
              {confirm?.next.cta}
            </Button>
          </>
        }
      >
        <ModalNote>
          {confirm?.next.next === 'PICKED_UP' ? (
            <p>
              Confirm that the food has been collected from{' '}
              <strong className="font-semibold">{donorName(confirm.pickup.donation)}</strong>. This
              records a collection time and moves the donation to Picked Up.
            </p>
          ) : (
            <p>
              Confirm that the batch has arrived at your kitchen. This records a delivery time and
              completes the rescue.
            </p>
          )}
        </ModalNote>
      </Modal>
    </div>
  );
}
