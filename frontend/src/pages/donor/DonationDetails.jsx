import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Info,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Soup,
  Thermometer,
  Truck,
  TriangleAlert,
  Utensils,
  XCircle,
} from 'lucide-react';

import {
  Badge,
  Banner,
  Button,
  Card,
  DietBadge,
  Modal,
  ModalNote,
  Skeleton,
  useToast,
} from '../../components/ui/index.js';
import { cancelDonation, getDonation } from '../../services/donation.service.js';
import { cn } from '../../utils/cn.js';
import { countdownLabel, formatDateTime, minutesUntil } from '../../utils/datetime.js';
import { formatQuantityWithWeight } from '../../utils/donationFormat.js';

/**
 * DonationDetails (donor) — one batch from the donor's side (page 10).
 *
 * Rebuilt from the Stitch donation screens, but the only actions a donor owns
 * are "view matches" and "withdraw". The donor API returns the batch, its
 * status and `matchedNgo` from GET /api/donations/:id; it does not expose the
 * NGO's pickup row, so pickup progress lives behind the donor pickup screen and
 * this page links to it rather than inventing a timeline.
 *
 * Withdraw is offered only while the batch is still AVAILABLE: once an NGO has
 * claimed it the API answers 409, and the copy says so instead of hiding the
 * reason.
 */

function ManifestRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
          {label}
        </p>
        <div className="mt-0.5 font-body-md text-body-md text-on-surface">{children}</div>
      </div>
    </div>
  );
}

/** What the donor should know about this status, in one line. */
const STATUS_NOTES = {
  AVAILABLE: 'Your batch is being matched with nearby verified NGOs.',
  ACCEPTED: 'An NGO has accepted this batch and will collect it before the deadline.',
  ASSIGNED: 'A volunteer has been assigned to move this batch.',
  PICKED_UP: 'This batch has been collected and is on its way to the NGO.',
  COMPLETED: 'This rescue is complete — the food reached people.',
  EXPIRED: 'The collection deadline passed before an NGO claimed this batch.',
  CANCELLED: 'You withdrew this batch, so it is no longer offered to NGOs.',
};

export default function DonationDetails() {
  const { id } = useParams();
  const { success, error: raiseError } = useToast();

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getDonation(id);
      setDonation(data.donation);
    } catch (apiError) {
      setLoadError(apiError?.message || 'Could not load this donation.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleWithdraw() {
    setCancelling(true);
    try {
      const data = await cancelDonation(id);
      setDonation(data.donation);
      success('Donation withdrawn. It is no longer offered to NGOs.');
      setConfirmOpen(false);
    } catch (apiError) {
      raiseError(apiError?.message || 'Could not withdraw this donation.');
      setConfirmOpen(false);
      // A 409 means an NGO claimed it first; reload to show the truth.
      load();
    } finally {
      setCancelling(false);
    }
  }

  // --- Loading --------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col gap-space-lg">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 gap-space-lg xl:grid-cols-3">
          <Skeleton className="h-72 w-full xl:col-span-2" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  // --- Error ----------------------------------------------------------------
  if (loadError || !donation) {
    return (
      <div className="flex flex-col gap-space-lg">
        <Banner
          variant="error"
          title="We could not load this donation"
          action={
            <Button size="sm" variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          }
        >
          {loadError || 'The donation could not be found.'}
        </Banner>
        <Button as={Link} to="/donor/donations" variant="ghost" className="self-start">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to my donations
        </Button>
      </div>
    );
  }

  const minutes = minutesUntil(donation.expiryTime);
  const urgent = minutes > 0 && minutes <= 60;
  const canWithdraw = donation.status === 'AVAILABLE' && !donation.isExpired;
  const hasRecipient = Boolean(donation.matchedNgo);
  const trackable = ['ACCEPTED', 'ASSIGNED', 'PICKED_UP', 'COMPLETED'].includes(
    donation.effectiveStatus
  );

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3">
        <Button as={Link} to="/donor/donations" variant="ghost" size="sm" className="self-start">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          My Donations
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary">
              <Soup className="h-6 w-6" aria-hidden="true" />
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
                <DietBadge vegetarian={donation.foodType === 'VEG'} />
              </div>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Published {formatDateTime(donation.createdAt, { withYear: true })}
                {hasRecipient ? (
                  <>
                    {' · Collected by '}
                    <span className="font-semibold text-on-surface">
                      {donation.matchedNgo.organizationName}
                    </span>
                  </>
                ) : (
                  ' · No NGO has collected it yet'
                )}
              </p>
            </div>
          </div>

          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-label-md text-label-md font-semibold',
              urgent ? 'bg-tertiary-fixed text-tertiary' : 'bg-surface-container-high text-on-surface'
            )}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            {donation.status === 'AVAILABLE'
              ? countdownLabel(donation.expiryTime)
              : donation.effectiveStatus}
          </span>
        </div>
      </header>

      {/* --- Status notices ------------------------------------------------ */}
      {donation.effectiveStatus === 'EXPIRED' && (
        <Banner variant="warning" title="The collection deadline has passed" icon={TriangleAlert}>
          This batch can no longer be accepted. Publish a fresh batch if the food is still safe to
          donate.
        </Banner>
      )}

      {donation.effectiveStatus === 'CANCELLED' && (
        <Banner variant="warning" title="You withdrew this batch" icon={XCircle}>
          It is no longer visible to NGOs. The record stays here for your history.
        </Banner>
      )}

      {canWithdraw && (
        <Banner variant="info" title="Still being matched" icon={Info}>
          {STATUS_NOTES[donation.effectiveStatus]}
        </Banner>
      )}

      <div className="grid grid-cols-1 gap-space-lg xl:grid-cols-3">
        {/* --- Manifest --------------------------------------------------- */}
        <Card padding="lg" className="flex flex-col gap-6 xl:col-span-2">
          <div>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Food Manifest
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Exactly what you recorded when this batch was published.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ManifestRow icon={Utensils} label="Category">
              {donation.foodCategory}
            </ManifestRow>
            <ManifestRow icon={Package} label="Quantity &amp; net yield">
              {formatQuantityWithWeight(donation.quantity, donation.quantityUnit)}
            </ManifestRow>
            <ManifestRow icon={Thermometer} label="Storage condition">
              {donation.storageCondition}
            </ManifestRow>
            <ManifestRow icon={Clock} label="Prepared">
              {formatDateTime(donation.preparationTime, { withYear: true })}
            </ManifestRow>
            <ManifestRow icon={Clock} label="Safe collection deadline">
              <span className={cn(urgent && 'font-semibold text-error')}>
                {formatDateTime(donation.expiryTime, { withYear: true })}
              </span>
            </ManifestRow>
            <ManifestRow icon={MapPin} label="Pickup point">
              {donation.latitude !== null && donation.longitude !== null
                ? `${donation.latitude}, ${donation.longitude}`
                : 'No pickup point on file'}
            </ManifestRow>
          </div>

          {donation.description && (
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
                Your notes
              </p>
              <p className="mt-1 rounded-xl bg-surface-container-low p-3 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                {donation.description}
              </p>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-secondary">
              <Info className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="font-body-sm text-[12px] leading-relaxed text-on-surface-variant">
              Matching does not certify food safety. The receiving NGO performs an on-site sensory
              and thermal check before the food enters distribution.
            </p>
          </div>
        </Card>

        {/* --- Recipient + actions ---------------------------------------- */}
        <div className="flex flex-col gap-space-lg">
          <Card padding="lg" className="flex flex-col gap-4">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Recipient
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Who can see and claim this batch.
              </p>
            </div>

            {hasRecipient ? (
              <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4">
                <p className="font-title-md text-title-md font-semibold text-on-surface">
                  {donation.matchedNgo.organizationName}
                </p>
                {donation.matchedNgo.address && (
                  <p className="flex items-start gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {donation.matchedNgo.address}
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-xl bg-surface-container-low p-4 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                {donation.isExpired
                  ? 'No NGO claimed this batch before the deadline.'
                  : 'No NGO has claimed this batch yet. Matching Results shows the ranked recommendations.'}
              </p>
            )}

            {typeof donation.matchCount === 'number' && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">{donation.matchCount}</span>{' '}
                {donation.matchCount === 1 ? 'NGO recommendation' : 'NGO recommendations'} on record
                for this batch.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button as={Link} to={`/donor/donations/${donation.id}/matches`} variant="primary">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                View Matches
              </Button>

              {trackable && (
                <Button as={Link} to={`/donor/pickups/${donation.id}`} variant="outline">
                  <Truck className="h-4 w-4" aria-hidden="true" />
                  Track Pickup
                </Button>
              )}

              {canWithdraw && (
                <Button type="button" variant="ghost" onClick={() => setConfirmOpen(true)}>
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  Withdraw Donation
                </Button>
              )}
            </div>
          </Card>

          <Card padding="lg" className="flex flex-col gap-2 bg-surface-container-low">
            <p className="font-title-md text-title-md font-semibold text-on-surface">
              {donation.effectiveStatus === 'AVAILABLE' ? 'Matching in progress' : 'Status'}
            </p>
            <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
              {STATUS_NOTES[donation.effectiveStatus]}
            </p>
          </Card>

          <p className="flex items-center gap-2 font-label-sm text-label-sm text-outline">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Only verified, accepting NGOs receive recommendations.
          </p>
        </div>
      </div>

      {/* --- Withdraw confirmation ----------------------------------------- */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Withdraw this donation?"
        subtitle={`Batch #${donation.id} · ${donation.foodName}`}
        icon={XCircle}
        tone="danger"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
              Keep it listed
            </Button>
            <Button type="button" variant="danger" loading={cancelling} onClick={handleWithdraw}>
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Confirm Withdrawal
            </Button>
          </>
        }
      >
        <ModalNote>
          <p>
            Withdrawing removes this batch from the matching engine, so no NGO can claim it. This
            cannot be undone.
          </p>
          <p className="mt-2">
            If an NGO has already claimed it, the withdrawal is refused and the batch stays with
            them.
          </p>
        </ModalNote>
      </Modal>
    </div>
  );
}
