import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Camera,
  Info,
  Lock,
  MapPin,
  Package,
  Phone,
  Save,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
  User,
} from 'lucide-react';

import {
  Badge,
  Banner,
  Button,
  Card,
  FilterPills,
  Input,
  Modal,
  Select,
  Toggle,
  useToast,
} from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  AVAILABILITY_WINDOWS,
  DONOR_TYPES,
  FOOD_CATEGORIES,
} from '../../constants/options.js';
import { ROLE_LABELS } from '../../constants/navigation.js';

/**
 * Edit Profile — page 26 (Design.md section 10).
 *
 * There is no profile-update endpoint in the MVP: auth.routes.js exposes only
 * register / login / me. The form therefore edits the AuthContext user for this
 * session and says so, instead of pretending a server accepted the change. The
 * validation, dirty tracking, sticky action bar and unsaved-changes modal are
 * all real, so the page can be wired to a PATCH endpoint later without
 * redesigning it.
 *
 * Fields follow section 10: common name / phone / read-only email, a local
 * photo preview, then role fields. Donor pickup points stay on each donation
 * because User has no donor address column; inventing one would break the
 * "do not invent data" rule.
 */

const ROLE_CARD = {
  DONOR: { title: 'Donor details', icon: Store },
  NGO: { title: 'Organisation details', icon: Building2 },
  VOLUNTEER: { title: 'Volunteer details', icon: Truck },
};

function splitChips(value) {
  return String(value || '')
    .split(',')
    .map((chip) => chip.trim())
    .filter(Boolean);
}

function buildForm(user) {
  return {
    name: user?.name || '',
    phone: user?.phone || '',
    organizationName: user?.organizationName || user?.ngo?.organizationName || '',
    donorType: user?.donorType || '',
    city: user?.city || '',
    availability: splitChips(user?.availability),
    hasVehicle: Boolean(user?.hasVehicle),
    ngoAddress: user?.ngo?.address || '',
    ngoCapacity:
      user?.ngo?.storageCapacity !== null && user?.ngo?.storageCapacity !== undefined
        ? String(Number(user.ngo.storageCapacity))
        : '',
    foodPreference: splitChips(user?.ngo?.foodPreference),
    isAccepting: user?.ngo?.isAccepting ?? true,
  };
}

function initialsOf(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfileEdit() {
  const { user, updateUser } = useAuth();
  const { success, error: raiseError } = useToast();
  const navigate = useNavigate();

  const initial = useMemo(() => buildForm(user), [user]);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [discardOpen, setDiscardOpen] = useState(false);

  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const photoRef = useRef(null);
  const fileRef = useRef(null);

  // Revoke the local object URL when the page unmounts.
  useEffect(
    () => () => {
      if (photoRef.current) URL.revokeObjectURL(photoRef.current);
    },
    []
  );

  const role = user?.role;
  const roleCard = ROLE_CARD[role] || { title: 'Account details', icon: User };
  const RoleIcon = roleCard.icon;

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial) || Boolean(photoUrl),
    [form, initial, photoUrl]
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      raiseError('Choose an image file (PNG, JPG or similar).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      raiseError('Choose an image smaller than 2 MB.');
      return;
    }

    const next = URL.createObjectURL(file);
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoRef.current = next;
    setPhotoUrl(next);
    setPhotoName(file.name);
  };

  const removePhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoRef.current = null;
    setPhotoUrl(null);
    setPhotoName('');
  };

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    const phone = form.phone.trim();
    const digits = phone.replace(/\D/g, '');

    if (name.length < 2) next.name = 'Enter your full name (at least 2 characters).';
    else if (name.length > 150) next.name = 'Keep your name under 150 characters.';

    if (phone && !/^[+()\d\s-]+$/.test(phone)) {
      next.phone = 'Use digits, spaces, +, - or parentheses only.';
    } else if (phone && (digits.length < 7 || digits.length > 15)) {
      next.phone = 'Enter between 7 and 15 digits.';
    }

    if (role === 'NGO') {
      if (form.organizationName.trim().length < 2) {
        next.organizationName = 'Enter the registered organisation name.';
      }
      if (form.ngoAddress.trim().length < 5) {
        next.ngoAddress = 'Enter the collection address (at least 5 characters).';
      }

      const capacity = Number(form.ngoCapacity);
      if (form.ngoCapacity === '' || !Number.isFinite(capacity) || capacity <= 0) {
        next.ngoCapacity = 'Enter a capacity greater than 0, in kg per day.';
      } else if (capacity > 100000) {
        next.ngoCapacity = 'Enter a capacity below 100,000 kg per day.';
      }
    }

    if (role === 'VOLUNTEER' && form.city.trim().length < 2) {
      next.city = 'Enter the city you can collect in.';
    }

    return next;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      raiseError('Please correct the highlighted fields.');
      return;
    }

    const patch = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
    };

    if (role === 'DONOR') {
      patch.organizationName = form.organizationName.trim() || null;
      patch.donorType = form.donorType || null;
    }

    if (role === 'NGO') {
      patch.organizationName = form.organizationName.trim();
      patch.ngo = {
        organizationName: form.organizationName.trim(),
        address: form.ngoAddress.trim(),
        storageCapacity: Number(form.ngoCapacity),
        foodPreference: form.foodPreference.join(', ') || null,
        isAccepting: form.isAccepting,
      };
    }

    if (role === 'VOLUNTEER') {
      patch.city = form.city.trim();
      patch.availability = form.availability.join(', ') || null;
      patch.hasVehicle = form.hasVehicle;
    }

    updateUser(patch);
    success('Profile updated for this session. The change is not sent to the server.');
    navigate('/profile');
  };

  const cancel = () => {
    if (dirty) setDiscardOpen(true);
    else navigate('/profile');
  };

  return (
    <div className="flex flex-col gap-space-lg">
      <header className="flex flex-col gap-4">
        <Link
          to="/profile"
          className="inline-flex w-fit items-center gap-1.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to profile
        </Link>

        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            Shared
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            Edit Profile
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Update the details shown on your profile. The email address is fixed to the account
            you signed in with.
          </p>
        </div>

        <Banner variant="info" title="Session-only edits">
          The backend has no profile-update endpoint yet, so Save changes your profile for this
          session only. A reload restores the values from the server.
        </Banner>
      </header>

      <form
        id="profile-edit-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-space-lg"
      >
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-3">
          {/* --- Common fields -------------------------------------------- */}
          <Card padding="lg" className="flex flex-col gap-5 lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                <User className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Personal Information
              </h2>
            </div>

            {/* Avatar is a local preview: there is no upload endpoint. */}
            <div className="flex flex-col gap-4 rounded-xl bg-surface-container-low p-4 sm:flex-row sm:items-center">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Selected profile"
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary font-display text-headline-sm font-bold text-on-primary">
                  {initialsOf(form.name || user.name)}
                </span>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    Change photo
                  </Button>
                  {photoUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={removePhoto}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="mt-1.5 break-words font-body-sm text-body-sm text-on-surface-variant">
                  {photoName || 'No new photo selected.'}
                </p>
                <p className="mt-0.5 font-label-sm text-label-sm text-outline">
                  Preview only — photo upload is not connected in this MVP.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhoto}
                  aria-label="Choose a profile photo"
                />
              </div>
            </div>

            <Input
              label="Full name"
              name="name"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              leadingIcon={User}
              required
              error={errors.name}
              autoComplete="name"
            />

            <Input
              label="Email address"
              name="email"
              type="email"
              value={user.email}
              leadingIcon={Lock}
              disabled
              hint="Email is fixed to your account and cannot be edited here."
            />

            <Input
              label="Phone number"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={(event) => setField('phone', event.target.value)}
              leadingIcon={Phone}
              optional
              error={errors.phone}
              autoComplete="tel"
              hint="Used only for pickup coordination."
            />
          </Card>

          {/* --- Role fields ---------------------------------------------- */}
          <Card padding="lg" className="flex h-fit flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                <RoleIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {roleCard.title}
              </h2>
            </div>

            {role === 'DONOR' && (
              <>
                <Input
                  label="Business name"
                  name="organizationName"
                  value={form.organizationName}
                  onChange={(event) => setField('organizationName', event.target.value)}
                  leadingIcon={Store}
                  optional
                />

                <Select
                  label="Donor type"
                  name="donorType"
                  value={form.donorType}
                  onChange={(event) => setField('donorType', event.target.value)}
                  placeholder="Select a donor type"
                  options={DONOR_TYPES.map((type) => ({ value: type, label: type }))}
                  optional
                />

                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="flex items-center gap-2 font-label-md text-label-md text-on-surface">
                    <MapPin className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
                    Pickup address
                  </p>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                    A donor profile stores no single address. Each donation records its own pickup
                    point, which is what the matching engine uses.
                  </p>
                  <Button
                    as={Link}
                    to="/donor/create-donation"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Open the donation form
                  </Button>
                </div>
              </>
            )}

            {role === 'NGO' && (
              <>
                <Input
                  label="Organisation name"
                  name="organizationName"
                  value={form.organizationName}
                  onChange={(event) => setField('organizationName', event.target.value)}
                  leadingIcon={Building2}
                  required
                  error={errors.organizationName}
                />

                <Input
                  label="Address"
                  name="ngoAddress"
                  value={form.ngoAddress}
                  onChange={(event) => setField('ngoAddress', event.target.value)}
                  leadingIcon={MapPin}
                  required
                  error={errors.ngoAddress}
                  hint="Shown to donors after a match is accepted."
                />

                <Input
                  label="Storage capacity (kg/day)"
                  name="ngoCapacity"
                  type="number"
                  min="0"
                  step="1"
                  value={form.ngoCapacity}
                  onChange={(event) => setField('ngoCapacity', event.target.value)}
                  leadingIcon={Package}
                  required
                  error={errors.ngoCapacity}
                />

                <div>
                  <p className="font-label-md text-label-md text-on-surface">Food preferences</p>
                  <p className="mt-0.5 font-label-sm text-label-sm text-outline">
                    Optional. Select every category your kitchen can accept.
                  </p>
                  <FilterPills
                    items={FOOD_CATEGORIES.map((category) => ({
                      value: category,
                      label: category,
                    }))}
                    value={form.foodPreference}
                    onChange={(next) => setField('foodPreference', next)}
                    multiple
                    ariaLabel="Food preferences"
                    className="mt-2"
                  />
                </div>

                <div className="border-t border-outline-variant pt-4">
                  <Toggle
                    id="ngo-accepting"
                    checked={form.isAccepting}
                    onChange={(next) => setField('isAccepting', next)}
                    label="Currently accepting donations"
                    description="When off, new batches are not recommended to your organisation."
                  />
                </div>

                <Banner variant="warning" title="Re-verification may be required">
                  Changes to organisation details may require re-verification.
                </Banner>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
                  <span className="flex items-center gap-2 font-label-md text-label-md text-on-surface">
                    <ShieldCheck className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
                    Verification
                  </span>
                  {user.ngo?.verificationStatus === 'VERIFIED' ? (
                    <Badge status="VERIFIED" />
                  ) : user.ngo?.verificationStatus === 'PENDING' ? (
                    <Badge status="PENDING" />
                  ) : user.ngo?.verificationStatus ? (
                    <Badge variant="danger">Rejected</Badge>
                  ) : (
                    <Badge variant="neutral">Not set</Badge>
                  )}
                </div>
              </>
            )}

            {role === 'VOLUNTEER' && (
              <>
                <Input
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={(event) => setField('city', event.target.value)}
                  leadingIcon={MapPin}
                  required
                  error={errors.city}
                  hint="Used to estimate how far a sample task is from you."
                />

                <div>
                  <p className="font-label-md text-label-md text-on-surface">Availability</p>
                  <p className="mt-0.5 font-label-sm text-label-sm text-outline">
                    Optional. Select every window you can collect in.
                  </p>
                  <FilterPills
                    items={AVAILABILITY_WINDOWS.map((window) => ({
                      value: window,
                      label: window,
                    }))}
                    value={form.availability}
                    onChange={(next) => setField('availability', next)}
                    multiple
                    ariaLabel="Availability windows"
                    className="mt-2"
                  />
                </div>

                <div className="border-t border-outline-variant pt-4">
                  <Toggle
                    id="volunteer-vehicle"
                    checked={form.hasVehicle}
                    onChange={(next) => setField('hasVehicle', next)}
                    label="Has own vehicle"
                    description="Larger batches may need a car, van or two-wheeler."
                  />
                </div>
              </>
            )}

            <p className="flex items-start gap-2 rounded-xl bg-surface-container-low p-3 font-label-sm text-label-sm text-on-surface-variant">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              You are editing the {ROLE_LABELS[role] || role} account {user.email}.
            </p>
          </Card>
        </div>

        {/* --- Sticky actions --------------------------------------------- */}
        <div className="sticky bottom-2 z-20 flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest/95 p-3 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {dirty ? 'You have unsaved changes.' : 'No changes yet.'}
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" onClick={cancel} fullWidth>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Changes
            </Button>
          </div>
        </div>
      </form>

      <Modal
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard unsaved changes?"
        subtitle="Your edits have not been saved."
        icon={AlertTriangle}
        tone="danger"
        size="sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDiscardOpen(false)}>
              Keep editing
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setDiscardOpen(false);
                navigate('/profile');
              }}
            >
              Discard changes
            </Button>
          </>
        }
      >
        <p className="font-body-md text-body-md text-on-surface-variant">
          Leaving this page now loses the values you changed. The rest of your profile is unchanged.
        </p>
      </Modal>
    </div>
  );
}
