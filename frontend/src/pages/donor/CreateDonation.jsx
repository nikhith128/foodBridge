import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Leaf,
  MapPin,
  Minus,
  RotateCcw,
  ShieldCheck,
  Soup,
  Thermometer,
  Trash2,
  TriangleAlert,
  Utensils,
} from 'lucide-react';

import { Badge, Banner, Button, Card, Input, Select, useToast } from '../../components/ui/index.js';
import {
  DEMO_PICKUP_ORIGIN,
  FOOD_CATEGORIES,
  FOOD_TYPES,
  QUANTITY_UNITS,
  STORAGE_CONDITIONS,
} from '../../constants/options.js';
import { createDonation } from '../../services/donation.service.js';
import { cn } from '../../utils/cn.js';
import { localValueFromNow, minutesUntil, parseDate, toIsoFromLocal, formatDateTime } from '../../utils/datetime.js';
import { estimateCo2eKg, estimateMeals, toKilograms } from '../../utils/donationFormat.js';

/**
 * CreateDonation — publish a surplus batch (Step C, PRD FR-04).
 *
 * Rebuilt from the Stitch Create Donation screen (page 4, shell `web_dashboard`).
 *
 * Field list follows PRD FR-04 exactly: food name, category, quantity,
 * vegetarian/non-vegetarian, preparation time, storage information, collection
 * deadline, pickup location and a description.
 *
 * Two deliberate departures from the screen:
 *   - "Food Category" offers the same list the Register screen uses for an NGO's
 *     accepted categories (constants/options.js FOOD_CATEGORIES). The screen's
 *     labels ("Cooked Meals (Ready to Eat)", "Dairy & Refrigerated Goods") are
 *     different strings, and the matching engine compares them literally, so
 *     using the screen's wording would silently break compatibility scoring.
 *   - the allergen toggles and the "AI Freshness Recommendation" are not built:
 *     allergens are not in the schema or the API contract, and the MVP has no
 *     model to justify a freshness verdict.
 *
 * What the screen shows but this page does not: the "State Preview" ribbon, the
 * "Telemetry Stream" panel, the ineligible-for-redistribution notice (the API
 * rejects unsafe batches with field errors instead) and the auto-matched success
 * overlay. On success the page navigates to the real matching results.
 */

const MAX_PREP_AGE_MINUTES = 4 * 60;

const EMPTY_FORM = {
  foodName: '',
  foodCategory: '',
  quantity: '',
  quantityUnit: 'kg',
  foodType: 'VEG',
  preparationTime: localValueFromNow(-1),
  storageCondition: '',
  expiryTime: localValueFromNow(6),
  latitude: String(DEMO_PICKUP_ORIGIN.latitude),
  longitude: String(DEMO_PICKUP_ORIGIN.longitude),
  description: '',
};

const DESCRIPTION_LIMIT = 1000;

function validate(form) {
  const errors = {};
  const now = Date.now();

  const foodName = form.foodName.trim();
  if (foodName.length < 2 || foodName.length > 190) {
    errors.foodName = 'Enter a food name between 2 and 190 characters.';
  }

  if (!FOOD_CATEGORIES.includes(form.foodCategory)) {
    errors.foodCategory = 'Choose a food category.';
  }

  const quantity = Number(form.quantity);
  if (form.quantity === '' || !Number.isFinite(quantity) || quantity <= 0) {
    errors.quantity = 'Enter a quantity greater than 0.';
  }

  if (!FOOD_TYPES.some((type) => type.value === form.foodType)) {
    errors.foodType = 'Choose vegetarian or non-vegetarian.';
  }

  const prep = parseDate(form.preparationTime);
  if (!prep) {
    errors.preparationTime = 'Enter the preparation date and time.';
  } else if (prep.getTime() > now + 5 * 60 * 1000) {
    errors.preparationTime = 'Preparation time cannot be in the future.';
  }

  const storage = form.storageCondition.trim();
  if (storage.length < 2 || storage.length > 190) {
    errors.storageCondition = 'Describe how the food is being stored.';
  }

  const expiry = parseDate(form.expiryTime);
  if (!expiry) {
    errors.expiryTime = 'Enter the collection deadline.';
  } else if (expiry.getTime() <= now) {
    errors.expiryTime = 'The collection deadline must be in the future.';
  } else if (prep && expiry.getTime() <= prep.getTime()) {
    errors.expiryTime = 'The deadline must be after the preparation time.';
  }

  const hasLat = form.latitude !== '';
  const hasLng = form.longitude !== '';
  if (!hasLat || !hasLng) {
    errors.latitude = 'Enter both the pickup latitude and longitude.';
  } else {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Latitude must be between -90 and 90.';
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'Longitude must be between -180 and 180.';
    }
  }

  if (form.description.length > DESCRIPTION_LIMIT) {
    errors.description = `Keep the description to ${DESCRIPTION_LIMIT} characters or fewer.`;
  }

  return errors;
}

function buildPayload(form) {
  return {
    foodName: form.foodName.trim(),
    foodCategory: form.foodCategory,
    quantity: Number(form.quantity),
    quantityUnit: form.quantityUnit,
    foodType: form.foodType,
    preparationTime: toIsoFromLocal(form.preparationTime),
    storageCondition: form.storageCondition.trim(),
    expiryTime: toIsoFromLocal(form.expiryTime),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    description: form.description.trim(),
  };
}

// --- Live derived checks ----------------------------------------------------

/**
 * The five safety checks the page can actually verify from the form. The Stitch
 * screen shows a fixed "5/5 Passed" with invented labels (thermal compliance,
 * allergen declarations); these are the real, derivable ones, so a draft that
 * would be refused by the API visibly fails here first.
 */
function safetyChecks(form) {
  const prep = parseDate(form.preparationTime);
  const expiry = parseDate(form.expiryTime);
  const now = Date.now();

  const prepLogged = Boolean(prep) && prep.getTime() <= now + 5 * 60 * 1000;
  const prepFresh = prepLogged && minutesUntil(prep, new Date()) >= -MAX_PREP_AGE_MINUTES;
  const storageSet = form.storageCondition.trim().length >= 2;
  const deadlineFuture = Boolean(expiry) && expiry.getTime() > now;
  const deadlineAfterPrep = Boolean(prep && expiry) && expiry.getTime() > prep.getTime();
  const locationSet =
    form.latitude !== '' &&
    form.longitude !== '' &&
    Number.isFinite(Number(form.latitude)) &&
    Number.isFinite(Number(form.longitude));

  return [
    {
      key: 'prep',
      label: 'Preparation time recorded',
      detail: prepLogged
        ? prepFresh
          ? 'Within the recommended four-hour cooked window.'
          : 'Prepared more than four hours ago — consider whether it is still safe to redistribute.'
          : 'Add the date and time the food was prepared.',
      passed: prepLogged,
      warn: prepLogged && !prepFresh,
    },
    {
      key: 'storage',
      label: 'Storage condition described',
      detail: storageSet ? form.storageCondition.trim() : 'State how the food is being held.',
      passed: storageSet,
    },
    {
      key: 'deadline',
      label: 'Collection deadline in the future',
      detail: deadlineFuture ? 'The batch can still be collected.' : 'Set a deadline that has not passed.',
      passed: deadlineFuture,
    },
    {
      key: 'order',
      label: 'Deadline after preparation',
      detail: deadlineAfterPrep
        ? 'The collection window is coherent.'
        : 'The deadline must be later than the preparation time.',
      passed: deadlineAfterPrep,
    },
    {
      key: 'location',
      label: 'Pickup point provided',
      detail: locationSet ? 'Matching can measure distance to nearby NGOs.' : 'Add the pickup coordinates.',
      passed: locationSet,
    },
  ];
}

// --- Local pieces -----------------------------------------------------------

function SectionHeading({ icon: Icon, title, description, badge }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h2>
          {badge}
        </div>
        <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{description}</p>
      </div>
    </div>
  );
}

function FoodTypeChoice({ value, onChange }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="font-label-md text-label-md text-on-surface">
        Dietary Classification
        <span className="text-error" aria-hidden="true">
          {' '}
          *
        </span>
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {FOOD_TYPES.map((type) => {
          const active = value === type.value;
          const Icon = type.value === 'VEG' ? Leaf : Utensils;
          return (
            <button
              key={type.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(type.value)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-label-md text-label-md transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
                active
                  ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {type.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function CheckRow({ check }) {
  const tone = check.passed ? (check.warn ? 'warn' : 'pass') : 'fail';
  const Icon = check.passed ? (check.warn ? TriangleAlert : CheckCircle2) : Minus;

  return (
    <li className="flex items-start gap-2.5">
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
          tone === 'pass' && 'bg-secondary-container text-on-secondary-container',
          tone === 'warn' && 'bg-tertiary-fixed text-tertiary',
          tone === 'fail' && 'bg-surface-container-high text-outline'
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            'font-label-md text-label-md font-semibold',
            check.passed ? 'text-on-surface' : 'text-on-surface-variant'
          )}
        >
          {check.label}
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{check.detail}</p>
      </div>
    </li>
  );
}

// --- Page -------------------------------------------------------------------

export default function CreateDonation() {
  const navigate = useNavigate();
  const { success, error: raiseError } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM, preparationTime: localValueFromNow(-1), expiryTime: localValueFromNow(6) });
    setErrors({});
    setFormError(null);
  }

  function useDemoPickupPoint() {
    setField('latitude', String(DEMO_PICKUP_ORIGIN.latitude));
    setField('longitude', String(DEMO_PICKUP_ORIGIN.longitude));
  }

  const checks = useMemo(() => safetyChecks(form), [form]);
  const passedCount = checks.filter((check) => check.passed).length;
  const canPublish = passedCount === checks.length && form.foodName.trim().length >= 2 && form.foodCategory;

  const summary = useMemo(() => {
    const kg = toKilograms(form.quantity, form.quantityUnit);
    const prep = parseDate(form.preparationTime);
    const expiry = parseDate(form.expiryTime);
    return {
      kg,
      meals: estimateMeals(form.quantity, form.quantityUnit),
      co2e: estimateCo2eKg(form.quantity, form.quantityUnit),
      prep,
      expiry,
      windowMinutes: prep && expiry ? Math.round((expiry.getTime() - prep.getTime()) / 60000) : null,
    };
  }, [form]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Please correct the highlighted fields before publishing.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await createDonation(buildPayload(form));
      success(`“${data.donation.foodName}” published. Finding nearby NGOs…`);
      navigate(`/donor/donations/${data.donation.id}/matches`);
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
        setFormError(apiError?.message || 'Could not publish the donation. Please try again.');
      }
      raiseError(apiError?.message || 'Could not publish the donation.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-space-lg">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
              Create Food Donation
            </h1>
            <Badge variant="positive" size="sm" icon={ShieldCheck}>
              Verified donor
            </Badge>
          </div>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Log a surplus batch and the matching engine ranks nearby verified NGOs by capacity,
            compatibility, distance and the time left before collection.
          </p>
        </div>

        <Button type="button" variant="ghost" onClick={resetForm} className="shrink-0">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Discard Draft
        </Button>
      </header>

      {formError && (
        <Banner variant="error" title="We could not publish this donation">
          {formError}
        </Banner>
      )}

      <div className="grid grid-cols-1 gap-space-lg xl:grid-cols-3">
        {/* --- Form ------------------------------------------------------- */}
        <form className="flex flex-col gap-space-lg xl:col-span-2" onSubmit={handleSubmit} noValidate>
          <Card padding="lg">
            <SectionHeading
              icon={Soup}
              title="Food Details & Classification"
              description="What the batch is, how much of it there is, and whether it is vegetarian."
              badge={
                <Badge variant="neutral" size="sm">
                  Required
                </Badge>
              }
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                containerClassName="sm:col-span-2"
                label="Food Title / Dish Name"
                name="foodName"
                placeholder="e.g. Hyderabadi Dum Biryani"
                value={form.foodName}
                onChange={(event) => setField('foodName', event.target.value)}
                error={errors.foodName}
                required
              />

              <Select
                label="Food Category"
                name="foodCategory"
                placeholder="Select a category"
                leadingIcon={Utensils}
                options={FOOD_CATEGORIES}
                value={form.foodCategory}
                onChange={(event) => setField('foodCategory', event.target.value)}
                error={errors.foodCategory}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Estimated Quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.5"
                  inputMode="decimal"
                  placeholder="e.g. 20"
                  value={form.quantity}
                  onChange={(event) => setField('quantity', event.target.value)}
                  error={errors.quantity}
                  required
                />
                <Select
                  label="Unit"
                  name="quantityUnit"
                  options={QUANTITY_UNITS}
                  value={form.quantityUnit}
                  onChange={(event) => setField('quantityUnit', event.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <FoodTypeChoice value={form.foodType} onChange={(value) => setField('foodType', value)} />
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <SectionHeading
              icon={Thermometer}
              title="Safety, Temperature & Expiry Window"
              description="Preparation time and the collection deadline decide whether the batch can be matched at all."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                containerClassName="sm:col-span-2"
                label="Current Holding & Storage Condition"
                name="storageCondition"
                placeholder="Select a storage condition"
                options={STORAGE_CONDITIONS}
                value={form.storageCondition}
                onChange={(event) => setField('storageCondition', event.target.value)}
                error={errors.storageCondition}
                hint="The API also accepts a custom description."
                required
              />

              <Input
                label="Preparation Date & Time"
                name="preparationTime"
                type="datetime-local"
                value={form.preparationTime}
                onChange={(event) => setField('preparationTime', event.target.value)}
                error={errors.preparationTime}
                required
              />

              <Input
                label="Safe Collection Deadline"
                name="expiryTime"
                type="datetime-local"
                value={form.expiryTime}
                onChange={(event) => setField('expiryTime', event.target.value)}
                error={errors.expiryTime}
                hint={
                  summary.expiry
                    ? `Collect by ${formatDateTime(summary.expiry)}.`
                    : 'When must the food be collected by?'
                }
                required
              />
            </div>
          </Card>

          <Card padding="lg">
            <SectionHeading
              icon={MapPin}
              title="Pickup Location"
              description="Coordinates let the matching engine measure the distance to each NGO."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Pickup Latitude"
                name="latitude"
                type="number"
                step="0.000001"
                inputMode="decimal"
                leadingIcon={Compass}
                value={form.latitude}
                onChange={(event) => setField('latitude', event.target.value)}
                error={errors.latitude}
                required
              />
              <Input
                label="Pickup Longitude"
                name="longitude"
                type="number"
                step="0.000001"
                inputMode="decimal"
                leadingIcon={Compass}
                value={form.longitude}
                onChange={(event) => setField('longitude', event.target.value)}
                error={errors.longitude}
                required
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-low p-3">
              <span className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <MapPin className="h-4 w-4 text-secondary" aria-hidden="true" />
                Demo pickup point: {DEMO_PICKUP_ORIGIN.latitude}, {DEMO_PICKUP_ORIGIN.longitude}
              </span>
              <Button type="button" size="sm" variant="outline" onClick={useDemoPickupPoint}>
                Reset to demo point
              </Button>
            </div>
          </Card>

          <Card padding="lg">
            <SectionHeading
              icon={Utensils}
              title="Additional Description"
              description="Optional handling notes, packaging details or anything the collecting NGO should know."
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="donation-description" className="font-label-md text-label-md text-on-surface">
                Handling Notes <span className="font-normal text-outline">(Optional)</span>
              </label>
              <textarea
                id="donation-description"
                name="description"
                rows={4}
                maxLength={DESCRIPTION_LIMIT}
                value={form.description}
                onChange={(event) => setField('description', event.target.value)}
                placeholder="e.g. Buffet surplus kept in sealed stainless-steel trays. Contains dairy and nuts."
                className={cn(
                  'w-full rounded-xl border bg-surface-container-lowest p-4 font-body-md text-body-md text-on-surface shadow-sm',
                  'placeholder:text-outline focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-surface-bright',
                  errors.description ? 'border-error ring-2 ring-error/60' : 'border-outline'
                )}
              />
              <div className="flex items-center justify-between gap-2 font-label-sm text-label-sm text-outline">
                {errors.description ? (
                  <span role="alert" className="text-error">
                    {errors.description}
                  </span>
                ) : (
                  <span>Shown to the NGOs that receive this batch.</span>
                )}
                <span>
                  {form.description.length}/{DESCRIPTION_LIMIT}
                </span>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              as={Link}
              to="/donor"
              variant="ghost"
              className="justify-center sm:justify-start"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              variant="primary"
              loading={submitting}
              disabled={!canPublish}
              title={canPublish ? undefined : 'Complete the safety checklist before publishing.'}
            >
              Publish Donation &amp; Match NGOs
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </form>

        {/* --- Live summary ---------------------------------------------- */}
        <aside className="flex flex-col gap-space-lg xl:sticky xl:top-[88px] xl:self-start">
          <Card padding="lg">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Live Rescue Summary
            </h2>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
              An estimate from the values entered above. Figures are approximate.
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                  <Soup className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Batch
                  </dt>
                  <dd className="truncate font-title-md text-title-md font-semibold text-on-surface">
                    {form.foodName.trim() || 'Untitled batch'}
                  </dd>
                  <dd className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Badge dot size="sm" variant={form.foodType === 'VEG' ? 'positive' : 'danger'}>
                      {form.foodType === 'VEG' ? 'Veg' : 'Non-Veg'}
                    </Badge>
                    {form.storageCondition && (
                      <Badge variant="neutral" size="sm">
                        {form.storageCondition}
                      </Badge>
                    )}
                  </dd>
                </div>
              </div>

              <div>
                <dt className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Approx. weight
                </dt>
                <dd className="font-headline-sm text-headline-sm font-bold text-primary">
                  {Math.round(summary.kg * 10) / 10} kg
                </dd>
              </div>
              <div>
                <dt className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Est. meals
                </dt>
                <dd className="font-headline-sm text-headline-sm font-bold text-primary">
                  {summary.meals}
                </dd>
              </div>
              <div>
                <dt className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Est. CO₂e diverted
                </dt>
                <dd className="font-headline-sm text-headline-sm font-bold text-primary">
                  {summary.co2e} kg
                </dd>
              </div>
              <div>
                <dt className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Collection window
                </dt>
                <dd className="font-headline-sm text-headline-sm font-bold text-primary">
                  {summary.windowMinutes && summary.windowMinutes > 0
                    ? `${Math.round((summary.windowMinutes / 60) * 10) / 10} h`
                    : '—'}
                </dd>
              </div>
            </dl>

            <p className="mt-4 flex items-start gap-2 font-body-sm text-[12px] leading-relaxed text-on-surface-variant">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-outline" aria-hidden="true" />
              Weight, meal and carbon figures are rough estimates derived from the quantity and unit,
              shown only to help you size the batch.
            </p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Safety Checklist
              </h2>
              <Badge variant={passedCount === checks.length ? 'positive' : 'urgent'} size="sm">
                {passedCount}/{checks.length} passed
              </Badge>
            </div>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
              These checks mirror the API's validation. A batch that fails here is refused by the
              server.
            </p>

            <ul className="mt-4 flex flex-col gap-3">
              {checks.map((check) => (
                <CheckRow key={check.key} check={check} />
              ))}
            </ul>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-tertiary-fixed/30 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" aria-hidden="true" />
              <p className="font-body-sm text-[12px] leading-relaxed text-tertiary">
                Matching does not certify food safety. Safe handling, storage and hand-off remain the
                responsibility of the donor and the receiving NGO.
              </p>
            </div>
          </Card>

          <div className="flex items-start gap-2.5 rounded-2xl bg-surface-container p-4">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
            <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
              Publishing makes the batch visible to verified, accepting NGOs and lets the matching
              engine rank them.
            </p>
          </div>
        </aside>
      </div>

      <div className="flex items-center gap-2 text-outline">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        <p className="font-label-sm text-label-sm">
          Drafts are not stored: leaving this page discards anything not yet published.
        </p>
      </div>
    </div>
  );
}
