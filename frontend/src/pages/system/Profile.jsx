import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Info,
  ListChecks,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  User,
} from 'lucide-react';

import { Badge, Button, Card, Skeleton } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  activeTasks,
  availableTasks,
  completedTasks,
  useVolunteerTasks,
} from '../../data/volunteerTasks.js';
import { listDonations } from '../../services/donation.service.js';
import { listPickups } from '../../services/pickup.service.js';
import { ROLE_LABELS } from '../../constants/navigation.js';
import { formatDateTime } from '../../utils/datetime.js';
import { cn } from '../../utils/cn.js';

/**
 * My Profile — page 25 (Design.md section 10).
 *
 * There is no Stitch screen for this page, so the layout follows the section 10
 * spec: a header card, Personal Information, My Activity and a role card. Every
 * value comes from the signed-in user (GET /auth/me) or from the API that owns
 * the activity counts. Nothing is invented:
 *
 *   Donor      business name and donor type are on User; a donor has no stored
 *              profile address, so the card says pickup points are set per
 *              donation instead of showing a made-up address or map pin.
 *   NGO        the Ngo row carries address, capacity, food preference,
 *              accepting flag, verification status and its real coordinates.
 *   Volunteer  city, availability and own-vehicle flag are on User. The task
 *              counts come from the labelled sample dispatch store.
 *
 * Activity counts call GET /api/donations (own donations) or GET /api/pickups
 * (own pickups). If that call fails the profile still renders and the card
 * offers a retry, rather than blocking the whole page on a secondary number.
 */

const ROLE_BADGE = {
  DONOR: 'deep',
  NGO: 'positive',
  VOLUNTEER: 'tint',
};

const ROLE_ICON = {
  DONOR: Store,
  NGO: Building2,
  VOLUNTEER: User,
};

const ROLE_CARD_TITLE = {
  DONOR: 'Donor details',
  NGO: 'Organisation details',
  VOLUNTEER: 'Volunteer details',
};

/** First letters of a display name, e.g. "Hope Foundation" -> "HF". */
function initialsOf(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** "15 Nov 2026" from an ISO timestamp; the time is dropped on purpose. */
function memberSince(value) {
  if (!value) return '—';
  return formatDateTime(value, { withYear: true }).split(',')[0];
}

/** "120" rather than "120.00" for the Ngo.storageCapacity decimal. */
function formatCapacity(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.round(number * 100) / 100) : '—';
}

function splitChips(value) {
  return String(value || '')
    .split(',')
    .map((chip) => chip.trim())
    .filter(Boolean);
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
          {label}
        </dt>
        <dd className="mt-0.5 break-words font-body-md text-body-md text-on-surface">{children}</dd>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const tasks = useVolunteerTasks();

  const isVolunteer = user?.role === 'VOLUNTEER';

  const [activity, setActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(!isVolunteer);
  const [activityError, setActivityError] = useState(null);

  const loadActivity = useCallback(async () => {
    if (!user || user.role === 'VOLUNTEER') return;

    setActivityLoading(true);
    setActivityError(null);

    try {
      if (user.role === 'DONOR') {
        const data = await listDonations();
        const donations = data.donations || [];
        const statuses = donations.map((donation) => donation.effectiveStatus || donation.status);
        const active = statuses.filter((status) =>
          ['AVAILABLE', 'ACCEPTED', 'ASSIGNED', 'PICKED_UP'].includes(status)
        ).length;
        const completed = statuses.filter((status) => status === 'COMPLETED').length;

        setActivity({
          metrics: [
            {
              key: 'published',
              label: 'Donations published',
              value: donations.length,
              icon: Package,
              to: '/donor/donations',
            },
            {
              key: 'active',
              label: 'Active batches',
              value: active,
              icon: Clock,
              to: '/donor/donations',
            },
            {
              key: 'completed',
              label: 'Completed rescues',
              value: completed,
              icon: CheckCircle2,
              to: '/impact',
            },
          ],
          cta: { to: '/donor/donations', label: 'Open My Donations' },
        });
      } else if (user.role === 'NGO') {
        const data = await listPickups();
        const pickups = data.pickups || [];
        const pending = pickups.filter((pickup) => pickup.status === 'PENDING').length;
        const completed = pickups.filter((pickup) => pickup.status === 'COMPLETED').length;

        setActivity({
          metrics: [
            {
              key: 'accepted',
              label: 'Accepted batches',
              value: pickups.length,
              icon: ClipboardCheck,
              to: '/ngo/accepted',
            },
            {
              key: 'pending',
              label: 'Pickups pending',
              value: pending,
              icon: Truck,
              to: '/ngo/pickups',
            },
            {
              key: 'completed',
              label: 'Completed collections',
              value: completed,
              icon: CheckCircle2,
              to: '/ngo/history',
            },
          ],
          cta: { to: '/ngo/accepted', label: 'Open My Accepted Donations' },
        });
      }
    } catch {
      setActivityError('Could not load your activity counts.');
    } finally {
      setActivityLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role !== 'VOLUNTEER') loadActivity();
  }, [user, loadActivity]);

  const volunteerActivity = useMemo(
    () => ({
      sample: true,
      metrics: [
        {
          key: 'available',
          label: 'Available sample tasks',
          value: availableTasks(tasks).length,
          icon: ListChecks,
          to: '/volunteer/tasks',
        },
        {
          key: 'active',
          label: 'Active tasks',
          value: activeTasks(tasks).length,
          icon: Truck,
          to: '/volunteer/my-tasks',
        },
        {
          key: 'completed',
          label: 'Completed tasks',
          value: completedTasks(tasks).length,
          icon: CheckCircle2,
          to: '/volunteer/my-tasks',
        },
      ],
      cta: { to: '/volunteer/my-tasks', label: 'Open My Tasks' },
    }),
    [tasks]
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;
  const isNgo = role === 'NGO';
  const displayName = isNgo
    ? user.ngo?.organizationName || user.organizationName || user.name
    : user.organizationName || user.name;
  const RoleIcon = ROLE_CARD_TITLE[role] ? ROLE_ICON[role] : User;
  const shownActivity = isVolunteer ? volunteerActivity : activity;
  const shownLoading = isVolunteer ? false : activityLoading;
  const ngoVerification = user.ngo?.verificationStatus;
  const coordinates =
    user.ngo?.latitude !== null &&
    user.ngo?.latitude !== undefined &&
    user.ngo?.longitude !== null &&
    user.ngo?.longitude !== undefined
      ? { latitude: user.ngo.latitude, longitude: user.ngo.longitude }
      : null;

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header>
        <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Shared</p>
        <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
          My Profile
        </h1>
        <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
          The account and organisation details the other portals use to identify you.
        </p>
      </header>

      {/* --- Identity card ------------------------------------------------ */}
      <Card padding="lg" className="relative overflow-hidden">
        <span
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-secondary-container/30 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary font-display text-headline-sm font-bold text-on-primary">
              {initialsOf(displayName)}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words font-display text-headline-sm font-bold text-on-surface">
                  {displayName}
                </h2>
                <Badge variant={ROLE_BADGE[role] || 'neutral'} size="sm">
                  {ROLE_LABELS[role] || role}
                </Badge>
                {isNgo &&
                  (ngoVerification === 'VERIFIED' ? (
                    <Badge status="VERIFIED" size="sm" />
                  ) : ngoVerification === 'PENDING' ? (
                    <Badge status="PENDING" size="sm" />
                  ) : ngoVerification ? (
                    <Badge variant="danger" size="sm">
                      Rejected
                    </Badge>
                  ) : null)}
              </div>

              <p className="mt-1.5 flex items-center gap-2 break-words font-body-sm text-body-sm text-on-surface-variant">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                {user.email}
              </p>
              <p className="mt-1 flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                {user.phone || 'No phone number saved'}
              </p>
              <p className="mt-1 flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                Member since {memberSince(user.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button as={Link} to="/profile/edit" variant="primary">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit Profile
            </Button>
            <Button as={Link} to="/settings" variant="outline">
              <SettingsIcon className="h-4 w-4" aria-hidden="true" />
              Settings
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-3">
        <div className="flex flex-col gap-space-lg lg:col-span-2">
          {/* --- Personal information ------------------------------------- */}
          <Card padding="lg">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                  <User className="h-4 w-4" aria-hidden="true" />
                </span>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Personal Information
                </h2>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <InfoRow icon={User} label="Full name">
                {user.name}
              </InfoRow>
              <InfoRow icon={Mail} label="Email address">
                {user.email}
                <span className="ml-2 font-label-sm text-label-sm text-outline">Read-only</span>
              </InfoRow>
              <InfoRow icon={Phone} label="Phone number">
                {user.phone || 'Not provided'}
              </InfoRow>
              <InfoRow icon={CalendarDays} label="Member since">
                {memberSince(user.createdAt)}
              </InfoRow>
              <InfoRow icon={ShieldCheck} label="Account role">
                {ROLE_LABELS[role] || role}
              </InfoRow>
              <InfoRow icon={BadgeCheck} label="Account status">
                Signed in with a verified session
              </InfoRow>
            </dl>
          </Card>

          {/* --- My activity ---------------------------------------------- */}
          <Card padding="lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    My Activity
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Counts from the records your account already owns.
                  </p>
                </div>
              </div>
              {isVolunteer && (
                <Badge variant="outline" size="sm" icon={Info}>
                  Sample data for demonstration
                </Badge>
              )}
            </div>

            {activityError && !isVolunteer ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
                <p className="font-body-sm text-body-sm text-on-surface-variant">{activityError}</p>
                <Button type="button" size="sm" variant="outline" onClick={loadActivity}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Retry
                </Button>
              </div>
            ) : shownLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (
              <>
                <ul className="divide-y divide-outline-variant">
                  {(shownActivity?.metrics || []).map((metric) => {
                    const MetricIcon = metric.icon;
                    return (
                      <li key={metric.key}>
                        <Link
                          to={metric.to}
                          className="flex items-center gap-3 rounded-lg py-3 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
                            <MetricIcon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="flex-1 font-body-md text-body-md text-on-surface-variant">
                            {metric.label}
                          </span>
                          <span className="font-display text-headline-sm font-bold text-primary">
                            {metric.value}
                          </span>
                          <ExternalLink className="h-4 w-4 text-outline" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {shownActivity?.cta && (
                  <Button
                    as={Link}
                    to={shownActivity.cta.to}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    {shownActivity.cta.label}
                  </Button>
                )}
              </>
            )}
          </Card>
        </div>

        {/* --- Role card --------------------------------------------------- */}
        <Card padding="lg" className="h-fit">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-high text-primary">
              <RoleIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              {ROLE_CARD_TITLE[role] || 'Account details'}
            </h2>
          </div>

          {role === 'DONOR' && (
            <dl className="flex flex-col gap-4">
              <InfoRow icon={Store} label="Business name">
                {user.organizationName || 'Not provided'}
              </InfoRow>
              <InfoRow icon={Package} label="Donor type">
                {user.donorType || 'Not set'}
              </InfoRow>
              <InfoRow icon={MapPin} label="Pickup address">
                Set on each donation, not on the donor profile.
              </InfoRow>
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  A donor account has no single stored address; each batch records its own pickup
                  point. Open the create form to see the fields used for matching.
                </p>
                <Button
                  as={Link}
                  to="/donor/create-donation"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Create a donation
                </Button>
              </div>
            </dl>
          )}

          {role === 'NGO' && (
            <dl className="flex flex-col gap-4">
              <InfoRow icon={Building2} label="Organisation name">
                {user.ngo?.organizationName || user.organizationName || user.name}
              </InfoRow>
              <InfoRow icon={MapPin} label="Address">
                {user.ngo?.address || 'Not set'}
              </InfoRow>
              <InfoRow icon={Package} label="Storage capacity">
                {user.ngo?.storageCapacity !== undefined && user.ngo?.storageCapacity !== null
                  ? `${formatCapacity(user.ngo.storageCapacity)} kg/day`
                  : 'Not set'}
              </InfoRow>
              <InfoRow icon={ShieldCheck} label="Verification">
                {ngoVerification === 'VERIFIED' ? (
                  <Badge status="VERIFIED" />
                ) : ngoVerification === 'PENDING' ? (
                  <Badge status="PENDING" />
                ) : ngoVerification ? (
                  <Badge variant="danger">Rejected</Badge>
                ) : (
                  'Not set'
                )}
              </InfoRow>
              <InfoRow icon={Truck} label="Accepting donations">
                <Badge variant={user.ngo?.isAccepting ? 'positive' : 'neutral'}>
                  {user.ngo?.isAccepting ? 'Currently accepting' : 'Not accepting'}
                </Badge>
              </InfoRow>

              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Food preferences
                </p>
                {splitChips(user.ngo?.foodPreference).length === 0 ? (
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Not set</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {splitChips(user.ngo?.foodPreference).map((chip) => (
                      <li key={chip}>
                        <Badge variant="neutral">{chip}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {coordinates ? (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=16/${coordinates.latitude}/${coordinates.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-label-md text-label-md text-secondary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  Open the recorded location in OpenStreetMap
                </a>
              ) : (
                <p className="font-label-sm text-label-sm text-outline">
                  No coordinates recorded for this organisation.
                </p>
              )}
            </dl>
          )}

          {role === 'VOLUNTEER' && (
            <dl className="flex flex-col gap-4">
              <InfoRow icon={MapPin} label="City">
                {user.city || 'Not set'}
              </InfoRow>
              <InfoRow icon={Truck} label="Own vehicle">
                <Badge variant={user.hasVehicle ? 'positive' : 'neutral'}>
                  {user.hasVehicle ? 'Has own vehicle' : 'No vehicle recorded'}
                </Badge>
              </InfoRow>

              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Availability
                </p>
                {splitChips(user.availability).length === 0 ? (
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Not set</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {splitChips(user.availability).map((chip) => (
                      <li key={chip}>
                        <Badge variant="neutral">{chip}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="rounded-xl bg-surface-container-low p-4 font-body-sm text-body-sm text-on-surface-variant">
                Volunteer task counts on this page come from the labelled sample dispatch list. The
                backend has no volunteer assignment endpoint yet.
              </p>
            </dl>
          )}
        </Card>
      </div>

      <p className={cn('flex items-center gap-2 font-label-sm text-label-sm text-outline')}>
        <Info className="h-4 w-4" aria-hidden="true" />
        Profile edits and notification settings are kept for this session until the corresponding
        API endpoints exist.
      </p>
    </div>
  );
}
