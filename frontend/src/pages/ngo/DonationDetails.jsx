import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Info,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  Route,
  ShieldCheck,
  Soup,
  Thermometer,
  TriangleAlert,
  Truck,
  Utensils,
  Warehouse,
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
import { acceptMatch, getDonation } from '../../services/donation.service.js';
import { cn } from '../../utils/cn.js';
import { countdownLabel, formatDateTime, minutesUntil } from '../../utils/datetime.js';
import { formatQuantityWithWeight, toKilograms } from '../../utils/donationFormat.js';
import { pickupStep } from '../../utils/pickupFormat.js';
import { donorName } from './NgoDashboard.jsx';

/**
 * DonationDetails — one batch, with the accept action (Step D).
 *
 * Rebuilt from the Stitch Donation Details screen (page 10, shell
 * `web_portal_ngo`). The data is GET /api/donations/:id, which for an NGO also
 * returns `myMatch` (the engine's recommendation for this NGO, and the id the
 * accept call needs), `myPickup` (when this NGO has already claimed it) and
 * `forYou` (the factor breakdown).
 *
 * The screen's state switcher, its IoT thermal telemetry probe, the "Spec Sheet"
 * download, the RFID returnable-asset panel, the FSSAI licence number and the
 * reject-with-reason flow are omitted. There is no reject endpoint in
 * Architecture.md section 8 — declining simply means not accepting.
 */

const FACTORS = [
  {
    key: 'capacity',
    label: 'Storage capacity',
    icon: Warehouse,
    weight: 0.3,
    describe: (donation) => `${toKilograms(donation.quantity, donation.quantityUnit)} kg batch`,
  },
  {
    key: 'compatibility',
    label: 'Food compatibility',
    icon: Utensils,
    weight: 0.25,
    describe: (donation) => donation.foodCategory,
  },
  {
    key: 'distance',
    label: 'Distance & transit',
    icon: Navigation,
    weight: 0.25,
    describe: (donation) => `${donation.latitude}, ${donation.longitude}`,
  },
  {
    key: 'collection',
    label: 'Collection window',
    icon: Clock,
    weight: 0.2,
    describe: (donation) => countdownLabel(donation.expiryTime),
  },
];

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

export default function DonationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: raiseError } = useToast();

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);

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

  const myMatch = donation?.myMatch;
  const myPickup = donation?.myPickup;
  const fit = donation?.forYou;

  const canAccept = useMemo(
    () =>
      Boolean(
        donation &&
          donation.status === 'AVAILABLE' &&
          !donation.isExpired &&
          myMatch &&
          myMatch.status === 'PENDING' &&
          fit?.eligible
      ),
    [donation, myMatch, fit]
  );

  async function handleAccept() {
    setAccepting(true);
    try {
      await acceptMatch(myMatch.id);
      success('Donation accepted. Head to Pickup Management to record the collection.');
      setConfirmOpen(false);
      navigate('/ngo/pickups');
    } catch (apiError) {
      raiseError(apiError?.message || 'Could not accept this donation.');
      setConfirmOpen(false);
      // A 409 means someone else got there first; reload to show the truth.
      load();
    } finally {
      setAccepting(false);
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
        <Button as={Link} to="/ngo/donations" variant="ghost" className="self-start">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to available donations
        </Button>
      </div>
    );
  }

  const minutes = minutesUntil(donation.expiryTime);
  const urgent = minutes > 0 && minutes <= 60;
  const claimedByOther = !myPickup && donation.status !== 'AVAILABLE';

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3">
        <Button as={Link} to="/ngo/donations" variant="ghost" size="sm" className="self-start">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Available Donations
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
                From <span className="font-semibold text-on-surface">{donorName(donation)}</span>
                {donation.donor?.donorType ? ` · ${donation.donor.donorType}` : ''}
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
            {donation.status === 'AVAILABLE' ? countdownLabel(donation.expiryTime) : donation.effectiveStatus}
          </span>
        </div>
      </header>

      {/* --- Claimed / not-eligible notices -------------------------------- */}
      {myPickup && (
        <Banner
          variant="success"
          title="You have claimed this batch"
          icon={CheckCircle2}
          action={
            <Button as={Link} to="/ngo/pickups" size="sm" variant="outline">
              <Truck className="h-4 w-4" aria-hidden="true" />
              Pickup Management
            </Button>
          }
        >
          Pickup status: <strong className="font-semibold">{pickupStep(myPickup.status)?.label}</strong>.
          Record the collection and delivery from Pickup Management.
        </Banner>
      )}

      {claimedByOther && (
        <Banner variant="warning" title="This batch has been claimed by another NGO" icon={TriangleAlert}>
          {donation.matchedNgo?.organizationName
            ? `${donation.matchedNgo.organizationName} accepted this batch.`
            : 'Another NGO accepted this batch.'}{' '}
          It is no longer available.
        </Banner>
      )}

      {!myPickup && donation.status === 'AVAILABLE' && fit && !fit.eligible && (
        <Banner variant="warning" title="Your NGO is not currently a match for this batch" icon={TriangleAlert}>
          {(fit.reasons || []).map((reason) => (
            <span key={reason} className="block">
              {reason}
            </span>
          ))}
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
              What the donor has recorded about this batch.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ManifestRow icon={Utensils} label="Category">
              {donation.foodCategory}
            </ManifestRow>
            <ManifestRow icon={Package} label="Quantity & net yield">
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
                Donor notes
              </p>
              <p className="mt-1 rounded-xl bg-surface-container-low p-3 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                {donation.description}
              </p>
            </div>
          )}

          {donation.donor?.phone && myPickup && (
            <div className="flex items-center gap-2 rounded-xl bg-surface-container-low p-3 font-body-sm text-body-sm text-on-surface-variant">
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              Donor contact: <span className="font-semibold text-on-surface">{donation.donor.phone}</span>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-secondary">
              <Info className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="font-body-sm text-[12px] leading-relaxed text-on-surface-variant">
              Matching does not certify food safety. Your coordinators must perform an on-site sensory
              and thermal check before admitting the food into distribution.
            </p>
          </div>
        </Card>

        {/* --- Match intelligence + accept -------------------------------- */}
        <div className="flex flex-col gap-space-lg">
          <Card padding="lg" className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Match Intelligence
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  How this batch scores for your NGO.
                </p>
              </div>
              {typeof fit?.score === 'number' && (
                <div className="flex shrink-0 items-baseline gap-1">
                  <span className="font-display text-headline-lg font-bold tracking-tight text-primary">
                    {Math.round(fit.score)}
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface-variant">
                    %
                  </span>
                </div>
              )}
            </div>

            {fit?.eligible && fit.breakdown ? (
              <div className="flex flex-col gap-4">
                {FACTORS.map((factor) => (
                  <FactorBar
                    key={factor.key}
                    icon={factor.icon}
                    label={factor.label}
                    weight={factor.weight}
                    value={fit.breakdown[factor.key]}
                    note={factor.describe(donation)}
                  />
                ))}
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {fit?.reasons?.length
                  ? `Not ranked: ${fit.reasons.join(' ')}`
                  : 'This batch is no longer being ranked.'}
              </p>
            )}

            {myMatch?.explanation && (
              <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-secondary">
                  <Route className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                  {myMatch.explanation}
                </p>
              </div>
            )}
          </Card>

          {/* --- Accept panel --------------------------------------------- */}
          <Card padding="lg" className="flex flex-col gap-4">
            {myPickup ? (
              <>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-secondary" aria-hidden="true" />
                  <p className="font-title-md text-title-md font-semibold text-on-surface">
                    Claimed by you
                  </p>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {pickupStep(myPickup.status)?.help}
                </p>
                <Button as={Link} to="/ngo/pickups" variant="primary">
                  <Truck className="h-4 w-4" aria-hidden="true" />
                  Open Pickup Management
                </Button>
              </>
            ) : canAccept ? (
              <>
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-secondary" aria-hidden="true" />
                  <p className="font-title-md text-title-md font-semibold text-on-surface">
                    Ready to accept
                  </p>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Accepting commits your organisation to collect this batch before{' '}
                  <span className="font-semibold text-on-surface">
                    {formatDateTime(donation.expiryTime, { withYear: true })}
                  </span>
                  . Other NGOs will not be able to claim it.
                </p>
                <Button type="button" variant="primary" onClick={() => setConfirmOpen(true)}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Accept Donation
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <TriangleAlert className="h-5 w-5 text-on-surface-variant" aria-hidden="true" />
                  <p className="font-title-md text-title-md font-semibold text-on-surface">
                    Not available to accept
                  </p>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {donation.status !== 'AVAILABLE'
                    ? 'This batch has already been claimed or closed.'
                    : donation.isExpired
                      ? 'The collection deadline has passed.'
                      : 'Your NGO is not currently eligible for this batch. See the reasons above.'}
                </p>
                <Button as={Link} to="/ngo/donations" variant="outline">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to available donations
                </Button>
              </>
            )}
          </Card>

          <p className="flex items-center gap-2 font-label-sm text-label-sm text-outline">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Only verified, accepting NGOs receive recommendations.
          </p>
        </div>
      </div>

      {/* --- Accept confirmation ------------------------------------------ */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Accept this donation?"
        subtitle={`Batch #${donation.id} · ${donation.foodName}`}
        icon={CheckCircle2}
        tone="positive"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
              Keep reviewing
            </Button>
            <Button type="button" variant="primary" loading={accepting} onClick={handleAccept}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Confirm &amp; Claim Batch
            </Button>
          </>
        }
      >
        <ModalNote>
          <p>
            By accepting, <strong className="font-semibold">{donorName(donation)}</strong> is committed
            to hand this batch over to you, and no other NGO can claim it.
          </p>
          <p className="mt-2">
            Collect before{' '}
            <strong className="font-semibold">
              {formatDateTime(donation.expiryTime, { withYear: true })}
            </strong>{' '}
            ({countdownLabel(donation.expiryTime)}). You can record the collection and delivery from
            Pickup Management.
          </p>
        </ModalNote>
      </Modal>
    </div>
  );
}
