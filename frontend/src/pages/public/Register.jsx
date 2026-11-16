import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bike,
  Building2,
  Check,
  HeartHandshake,
  Lock,
  LockKeyhole,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Snowflake,
  Store,
  User,
} from 'lucide-react';

import SocialAuthButtons from '../../components/public/SocialAuthButtons.jsx';
import Logo from '../../components/shared/Logo.jsx';
import { Banner, Button, Input, Select, useToast } from '../../components/ui/index.js';
import { SHOW_SOCIAL_LOGIN } from '../../constants/features.js';
import { AUTH_BENEFITS, DEMO_METRIC } from '../../constants/marketing.js';
import {
  AVAILABILITY_WINDOWS,
  DONOR_TYPES,
  FOOD_CATEGORIES,
  PASSWORD_HINT,
} from '../../constants/options.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { homePathForRole } from '../../routes/guards.js';
import { cn } from '../../utils/cn.js';
import { meetsPasswordRule, passwordStrength } from '../../utils/passwordStrength.js';

/**
 * Register — the public sign-up page.
 *
 * Rebuilt from the Stitch Register screen (page 1, `web_standard`): a two-panel
 * card, the gradient story panel on the left and the form on the right.
 *
 * What the screen shows but this page does not:
 *   - the "Preview Mode" pill bar at the top, which is a Stitch device for
 *     flipping between demo states, not a feature;
 *   - the success overlay, which exists because the screen has no backend. Here
 *     a successful POST /auth/register creates the session, so the page navigates
 *     straight to the new user's dashboard with a toast.
 *
 * The role-specific blocks mirror backend/src/utils/validators.js exactly:
 *   DONOR      organisation name (optional) + facility type
 *   NGO        registered name + address + capacity (kg/day) + notes + categories
 *   VOLUNTEER  city hub + availability windows + own-vehicle flag
 *
 * Client validation is a courtesy that avoids a round-trip; the API is still the
 * authority and its field errors are mapped back onto the inputs.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ROLE_CARDS = [
  { value: 'DONOR', label: 'Donor', blurb: 'I have surplus food to donate', icon: Store },
  { value: 'NGO', label: 'NGO', blurb: 'We collect and distribute meals', icon: HeartHandshake },
  { value: 'VOLUNTEER', label: 'Volunteer', blurb: 'Help with pickup & delivery', icon: Bike },
];

const EMPTY_FORM = {
  role: 'DONOR',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  organizationName: '',
  donorType: '',
  address: '',
  storageCapacity: '',
  capacityNotes: '',
  foodPreference: [],
  city: '',
  availability: [],
  hasVehicle: false,
  acceptedTerms: false,
};

// --- Validation -------------------------------------------------------------

function validate(form) {
  const errors = {};

  if (form.name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (form.phone.trim() && (form.phone.trim().length < 6 || form.phone.trim().length > 30)) {
    errors.phone = 'Enter a valid phone number.';
  }
  if (!meetsPasswordRule(form.password)) {
    errors.password = 'Password must be at least 8 characters and include a letter and a number.';
  }
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';

  if (form.role === 'DONOR' && !form.donorType) {
    errors.donorType = 'Choose the type of facility you are donating from.';
  }

  if (form.role === 'NGO') {
    if (form.organizationName.trim().length < 2) {
      errors.organizationName = 'Enter the registered organisation name.';
    }
    if (form.address.trim().length < 5) {
      errors.address = 'Enter the operating address and city hub.';
    }
    const capacity = Number(form.storageCapacity);
    if (form.storageCapacity === '' || !Number.isFinite(capacity) || capacity < 0) {
      errors.storageCapacity = 'Enter a capacity of 0 or more, in kg per day.';
    }
  }

  if (!form.acceptedTerms) errors.acceptedTerms = 'Please accept the terms to create your account.';

  return errors;
}

function buildPayload(form) {
  const base = {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    password: form.password,
    role: form.role,
  };

  if (form.role === 'DONOR') {
    return {
      ...base,
      organizationName: form.organizationName.trim(),
      donorType: form.donorType,
    };
  }

  if (form.role === 'NGO') {
    return {
      ...base,
      organizationName: form.organizationName.trim(),
      address: form.address.trim(),
      storageCapacity: Number(form.storageCapacity),
      capacityNotes: form.capacityNotes.trim(),
      foodPreference: form.foodPreference,
    };
  }

  return {
    ...base,
    city: form.city.trim(),
    availability: form.availability,
    hasVehicle: form.hasVehicle,
  };
}

// --- Local pieces -----------------------------------------------------------

function RoleCard({ card, active, onSelect }) {
  const Icon = card.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(card.value)}
      aria-pressed={active}
      className={cn(
        'flex h-full flex-col items-start gap-2.5 rounded-2xl border-2 p-3.5 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        active
          ? 'border-primary bg-secondary-container/30 shadow-sm'
          : 'border-transparent bg-surface-container-low hover:bg-surface-container'
      )}
    >
      <div className="flex w-full items-start justify-between">
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-xl',
            active ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface'
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {active && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-sm">
            <Check className="h-3 w-3" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="w-full">
        <h3 className={cn('font-title-md text-title-md font-semibold', active ? 'text-primary' : 'text-on-surface')}>
          {card.label}
        </h3>
        <p className="mt-0.5 font-body-sm text-[12px] leading-tight text-on-surface-variant">{card.blurb}</p>
      </div>
    </button>
  );
}

function CheckPill({ checked, onChange, children, shape = 'pill' }) {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 bg-surface-container text-body-sm text-on-surface transition-colors hover:bg-surface-container-high',
        shape === 'pill' ? 'rounded-full px-3 py-1.5' : 'justify-center rounded-xl px-3 py-2'
      )}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded accent-secondary" />
      <span>{children}</span>
    </label>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant">
        {children}
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-surface-container-high" />
    </div>
  );
}

function StoryPanel() {
  return (
    <aside className="relative hidden flex-col overflow-hidden bg-gradient-to-br from-primary via-primary-container to-primary p-8 text-on-primary lg:col-span-5 lg:flex lg:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-secondary-fixed/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-24 h-72 w-72 rounded-full bg-on-tertiary-container/10 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-space-md">
        <div className="flex items-center gap-space-sm">
          <Logo tone="on-primary" />
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-container-lowest/15 px-3 py-1 font-label-sm text-label-sm text-secondary-fixed backdrop-blur-md">
          AI-Assisted Community Food Rescue
        </span>

        <div className="mt-2">
          <h1 className="font-display text-headline-lg-mobile font-bold leading-tight text-on-primary lg:text-headline-lg">
            Join the food rescue community
          </h1>
          <p className="mt-space-sm font-body-md text-body-md leading-relaxed text-on-primary-container">
            Create your free account and start turning surplus harvest into nutritious meals for
            local shelters, soup kitchens, and verified aid networks.
          </p>
        </div>

        <div className="flex flex-col gap-space-md pt-space-sm">
          {AUTH_BENEFITS.REGISTER.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.key} className="flex items-start gap-space-sm">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-fixed/20 text-secondary-fixed">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <p className="font-body-sm text-body-sm text-surface-container-low">{benefit.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mt-space-lg flex flex-1 flex-col gap-3 rounded-2xl bg-surface-container-lowest/10 p-4 shadow-lg backdrop-blur-md">
        <div className="relative min-h-[10rem] w-full flex-1 overflow-hidden rounded-xl bg-primary-container">
          <picture className="block h-full w-full">
            <source srcSet="/auth-register.webp" type="image/webp" />
            <img
              src="/auth-register.jpg"
              alt="A volunteer carrying rescued food to a community kitchen partner"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </picture>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,40,20,0.55)_0%,rgba(0,40,20,0.15)_45%,transparent_100%)]"
          />
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/90 px-2.5 py-0.5 backdrop-blur-md">
            <span className="font-label-sm text-[11px] text-primary">Sample</span>
            <span aria-hidden="true" className="h-3 w-px bg-outline-variant" />
            <span className="font-label-sm text-[11px] text-primary">
              {DEMO_METRIC.value} {DEMO_METRIC.label.toLowerCase()}
            </span>
          </span>
        </div>

        <span className="font-label-sm text-[10px] uppercase tracking-wider text-secondary-fixed/90">
          Sample testimonial
        </span>
        <p className="font-body-sm text-body-sm italic leading-snug text-on-primary/90">
          &ldquo;The rescue network is built for kitchens of every size — log surplus once, and the
          matching engine finds the closest verified home for it.&rdquo;
        </p>
        <span className="font-label-sm text-label-sm font-semibold text-mint">Harvest Hope Kitchens</span>
      </div>
    </aside>
  );
}

// --- Page -------------------------------------------------------------------

export default function Register() {
  const { register } = useAuth();
  const { success, error: raiseError } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(form.password);
  const strengthTone = !form.password
    ? 'text-on-surface-variant'
    : strength.score >= 3
      ? 'text-secondary'
      : strength.score === 2
        ? 'text-tertiary'
        : 'text-error';
  const strengthBarTone =
    strength.score >= 3 ? 'bg-secondary' : strength.score === 2 ? 'bg-tertiary-container' : 'bg-error';

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  }

  function toggleInList(key, value) {
    setForm((current) => {
      const list = current[key];
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...current, [key]: next };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await register(buildPayload(form));
      success(
        user.role === 'NGO'
          ? 'Account created. Your NGO profile is awaiting verification.'
          : `Welcome to FoodBridge AI, ${user.name.split(' ')[0]}.`
      );
      navigate(homePathForRole(user.role), { replace: true });
    } catch (apiError) {
      const fieldErrors = apiError?.errors || [];
      if (fieldErrors.length > 0) {
        const mapped = {};
        for (const entry of fieldErrors) {
          if (entry?.field) mapped[entry.field] = entry.message;
        }
        setErrors(mapped);
        setFormError(apiError.message || 'Please correct the highlighted fields.');
      } else {
        setFormError(apiError?.message || 'Something went wrong. Please try again.');
      }
      raiseError(apiError?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const isDonor = form.role === 'DONOR';
  const isNgo = form.role === 'NGO';
  const isVolunteer = form.role === 'VOLUNTEER';

  return (
    <section className="w-full px-gutter-mobile py-space-xl">
      <div className="mx-auto grid w-full max-w-[1140px] grid-cols-1 overflow-hidden rounded-3xl bg-surface-container-lowest shadow-overlay lg:grid-cols-12">
        <StoryPanel />

        <div className="flex flex-col gap-6 p-6 sm:p-10 lg:col-span-7">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-headline-md-mobile font-semibold text-on-surface sm:text-headline-md">
              Create your account
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="font-label-md font-semibold text-secondary hover:underline">
                Log in
              </Link>
            </p>
          </div>

          {formError && (
            <Banner variant="error" title="We could not create your account">
              {formError}
            </Banner>
          )}

          <div className="flex flex-col gap-2">
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              I want to join as
            </span>
            <div
              role="group"
              aria-label="I want to join as"
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {ROLE_CARDS.map((card) => (
                <RoleCard
                  key={card.value}
                  card={card}
                  active={form.role === card.value}
                  onSelect={(value) => setField('role', value)}
                />
              ))}
            </div>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                containerClassName="sm:col-span-2"
                label="Full Name"
                name="name"
                autoComplete="name"
                placeholder="e.g. Sarah Jenkins"
                leadingIcon={User}
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                error={errors.name}
                required
              />
              <Input
                label="Work / Primary Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@organisation.org"
                leadingIcon={Mail}
                value={form.email}
                onChange={(event) => setField('email', event.target.value)}
                error={errors.email}
                required
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. +91 98765 43210"
                leadingIcon={Phone}
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
                error={errors.phone}
                optional
              />
              <div className="flex flex-col gap-1.5">
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  leadingIcon={Lock}
                  value={form.password}
                  onChange={(event) => setField('password', event.target.value)}
                  error={errors.password}
                  required
                />
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((segment) => (
                    <span
                      key={segment}
                      className={cn(
                        'h-1.5 flex-1 rounded-full',
                        segment <= strength.score ? strengthBarTone : 'bg-surface-container-highest'
                      )}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2 font-label-sm text-label-sm">
                  <span className="text-on-surface-variant">Password strength</span>
                  <span aria-live="polite" className={cn('font-semibold', strengthTone)}>
                    {form.password ? strength.label : '—'}
                  </span>
                </div>
                <p className="text-left font-label-sm text-label-sm text-on-surface-variant">
                  {PASSWORD_HINT}
                </p>
              </div>
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                leadingIcon={LockKeyhole}
                value={form.confirmPassword}
                onChange={(event) => setField('confirmPassword', event.target.value)}
                error={errors.confirmPassword}
                required
              />
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <SectionLabel>Role Details</SectionLabel>

              {isDonor && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Organization / Business Name"
                    name="organizationName"
                    placeholder="e.g. Daily Greens Market"
                    leadingIcon={Building2}
                    value={form.organizationName}
                    onChange={(event) => setField('organizationName', event.target.value)}
                    error={errors.organizationName}
                    optional
                  />
                  <Select
                    label="Donor Facility Type"
                    name="donorType"
                    placeholder="Select a facility type"
                    leadingIcon={Store}
                    options={DONOR_TYPES}
                    value={form.donorType}
                    onChange={(event) => setField('donorType', event.target.value)}
                    error={errors.donorType}
                    required
                  />
                </div>
              )}

              {isNgo && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="NGO / Trust Registered Name"
                      name="organizationName"
                      placeholder="e.g. Hope Harvest Community Foundation"
                      leadingIcon={Building2}
                      value={form.organizationName}
                      onChange={(event) => setField('organizationName', event.target.value)}
                      error={errors.organizationName}
                      required
                    />
                    <Input
                      label="Operating Address & City Hub"
                      name="address"
                      placeholder="e.g. 142 Riverway St, Metro Hub"
                      leadingIcon={MapPin}
                      value={form.address}
                      onChange={(event) => setField('address', event.target.value)}
                      error={errors.address}
                      required
                    />
                    <Input
                      label="Storage Capacity"
                      name="storageCapacity"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      placeholder="e.g. 600"
                      leadingIcon={Snowflake}
                      value={form.storageCapacity}
                      onChange={(event) => setField('storageCapacity', event.target.value)}
                      error={errors.storageCapacity}
                      hint="Kilograms of fresh food you can hold per day."
                      required
                    />
                    <Input
                      label="Capacity Notes"
                      name="capacityNotes"
                      placeholder="e.g. 450 cu ft walk-in chiller"
                      leadingIcon={Snowflake}
                      value={form.capacityNotes}
                      onChange={(event) => setField('capacityNotes', event.target.value)}
                      error={errors.capacityNotes}
                      optional
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="font-label-md text-label-md text-on-surface">
                      Accepted Food Categories
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {FOOD_CATEGORIES.map((category) => (
                        <CheckPill
                          key={category}
                          checked={form.foodPreference.includes(category)}
                          onChange={() => toggleInList('foodPreference', category)}
                        >
                          {category}
                        </CheckPill>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl bg-tertiary-fixed/30 p-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-tertiary" aria-hidden="true" />
                    <p className="font-body-sm text-[12px] leading-relaxed text-tertiary">
                      NGO accounts are reviewed before they can be matched with live donations. You
                      can sign in and complete your profile while verification is pending.
                    </p>
                  </div>
                </div>
              )}

              {isVolunteer && (
                <div className="flex flex-col gap-4">
                  <Input
                    label="City / Preferred Neighborhood Hub"
                    name="city"
                    placeholder="e.g. Downtown Central / Westside Districts"
                    leadingIcon={Navigation}
                    value={form.city}
                    onChange={(event) => setField('city', event.target.value)}
                    error={errors.city}
                    optional
                  />

                  <div className="flex flex-col gap-2">
                    <span className="font-label-md text-label-md text-on-surface">
                      Weekly Availability Windows
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {AVAILABILITY_WINDOWS.map((window) => (
                        <CheckPill
                          key={window}
                          shape="box"
                          checked={form.availability.includes(window)}
                          onChange={() => toggleInList('availability', window)}
                        >
                          {window}
                        </CheckPill>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
                        <Bike className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-title-md text-sm font-semibold text-on-surface">
                          Own vehicle available?
                        </p>
                        <p className="font-body-sm text-[12px] text-on-surface-variant">
                          Car, cargo bike, electric van, or scooter
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={form.hasVehicle}
                        onChange={(event) => setField('hasVehicle', event.target.checked)}
                      />
                      <span className="sr-only">Own vehicle available</span>
                      <span
                        className={cn(
                          'relative h-6 w-11 rounded-full bg-surface-container-highest transition-colors',
                          'after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full',
                          "after:bg-surface-container-lowest after:transition-all after:content-['']",
                          'peer-checked:bg-secondary peer-checked:after:translate-x-full',
                          'peer-focus-visible:ring-2 peer-focus-visible:ring-secondary/40'
                        )}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 pt-2">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={form.acceptedTerms}
                  onChange={(event) => setField('acceptedTerms', event.target.checked)}
                  aria-invalid={errors.acceptedTerms ? true : undefined}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline accent-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                />
                <span className="font-body-sm text-body-sm leading-snug text-on-surface-variant">
                  I agree to the{' '}
                  <span className="font-semibold text-secondary underline underline-offset-2">
                    Terms of Service
                  </span>
                  , the{' '}
                  <span className="font-semibold text-secondary underline underline-offset-2">
                    safe food handling pledge
                  </span>
                  , and the{' '}
                  <span className="font-semibold text-secondary underline underline-offset-2">
                    Privacy Policy
                  </span>
                  .
                </span>
              </label>
              {errors.acceptedTerms && (
                <p role="alert" className="font-label-sm text-label-sm text-error">
                  {errors.acceptedTerms}
                </p>
              )}
            </div>

            <Button type="submit" size="lg" variant="primary" fullWidth loading={submitting} className="mt-2">
              Create Account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>

          {SHOW_SOCIAL_LOGIN && (
            <>
              <div className="relative flex items-center justify-center">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 h-px bg-surface-container-high"
                />
                <span className="relative bg-surface-container-lowest px-4 font-label-sm text-label-sm text-on-surface-variant">
                  or sign up with
                </span>
              </div>

              <SocialAuthButtons />
            </>
          )}

          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-container-low px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-secondary" />
              Demo environment — local database only
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
