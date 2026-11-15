/**
 * The AI matching engine (PRD FR-07, FR-08, FR-09; Architecture.md section 9).
 *
 * A rule-based, deterministic scorer — not a trained model. The whole thing is a
 * set of pure functions so scripts/smoke-matching.js can check every factor
 * without a database or an HTTP server.
 *
 * Pipeline (Architecture.md section 9, "Matching Process"):
 *   1. eligibility    the donation must pass its safety checks, and every NGO is
 *                     filtered to verified, accepting organisations that can
 *                     actually take this food and have a usable location
 *   2. scoring        four weighted factors, each normalised to 0..1
 *   3. ranking        highest score first, nearest as the tie-break
 *   4. explanation    one sentence naming the real numbers behind the score
 *
 * Weights are the ones in the docs and are not tuned to flatter the demo data:
 *   capacity 30%  |  food compatibility 25%  |  distance 25%  |  collection 20%
 *
 * Food safety is a filter, never a score (Architecture.md section 9). A donation
 * that fails eligibility is returned with `eligible: false` and reasons, and no
 * NGO is ranked — the UI must not show a ranked list for ineligible food.
 */

const { hasCoordinates, haversineKm } = require('../utils/geo');

const WEIGHTS = {
  capacity: 0.3,
  compatibility: 0.25,
  distance: 0.25,
  collection: 0.2,
};

/**
 * Approximate kilograms per unit, so a donation measured in servings or crates
 * can be compared against an NGO's kg/day capacity. These are deliberately rough
 * averages, documented here rather than hidden in the maths.
 */
const UNIT_TO_KG = {
  kg: 1,
  servings: 0.4,
  crates: 15,
  trays: 5,
  packets: 0.5,
};

/** Beyond this radius the distance score is 0. */
const MAX_DISTANCE_KM = 12;

/** Assumed average courier speed, used to turn distance into transit minutes. */
const AVG_SPEED_KMH = 20;

/** Fixed handling time (loading, hand-off, paperwork) added to every transit. */
const HANDLING_MINUTES = 20;

const MINUTE_MS = 60 * 1000;

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** The donation's quantity expressed in approximate kilograms. */
function toKilograms(quantity, unit) {
  const factor = UNIT_TO_KG[unit] ?? 1;
  return Number(quantity) * factor;
}

/** "VEG, NON_VEG" / "VEG" -> ['VEG', 'NON_VEG']. */
function parsePreference(value) {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * A veg-only kitchen: its accepted list is non-empty and contains nothing but
 * the "Vegetarian Only" category. Such an NGO must never be offered non-veg
 * food, however good the rest of the score is.
 */
function isVegetarianOnly(acceptedCategories) {
  return acceptedCategories.length > 0 && acceptedCategories.every((c) => c === 'Vegetarian Only');
}

// ---------------------------------------------------------------------------
// 1. Eligibility
// ---------------------------------------------------------------------------

/**
 * The donation-side safety gate. Mirrors the creation rules in
 * utils/validators.js so a donation that expires, or that was written directly
 * to the database, is still refused by the engine.
 *
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
function checkDonationEligibility(donation, now = new Date()) {
  const reasons = [];
  const nowMs = now.getTime();

  if (!donation) {
    return { eligible: false, reasons: ['The donation could not be found.'] };
  }

  if (donation.status === 'CANCELLED') reasons.push('The donation has been withdrawn.');
  if (donation.status === 'EXPIRED') reasons.push('The donation is marked expired.');
  if (['ACCEPTED', 'ASSIGNED', 'PICKED_UP', 'COMPLETED'].includes(donation.status)) {
    reasons.push('The donation has already been claimed.');
  }

  if (!donation.preparationTime) {
    reasons.push('The preparation time is missing.');
  } else if (new Date(donation.preparationTime).getTime() > nowMs) {
    reasons.push('The preparation time is in the future.');
  }

  if (!donation.storageCondition || String(donation.storageCondition).trim().length < 2) {
    reasons.push('The storage condition is missing.');
  }

  if (!donation.expiryTime) {
    reasons.push('The collection deadline is missing.');
  } else if (new Date(donation.expiryTime).getTime() <= nowMs) {
    reasons.push('The collection deadline has passed.');
  }

  if (!(Number(donation.quantity) > 0)) {
    reasons.push('The quantity must be greater than zero.');
  }

  // Distance is a quarter of the score and FR-08 forbids inventing coordinates,
  // so a donation with no pickup point cannot be matched.
  if (!hasCoordinates(donation)) {
    reasons.push('The pickup location is missing.');
  }

  return { eligible: reasons.length === 0, reasons };
}

/**
 * The NGO-side gate. An NGO is only a candidate when it is verified, currently
 * accepting, can hold the food's weight, is allowed to handle this food type,
 * and has a usable location (distance is 25% of the score, so a point is
 * mandatory — FR-08 forbids inventing one).
 *
 * @returns {{ eligible: boolean, reasons: string[], acceptedCategories: string[] }}
 */
function checkNgoEligibility(ngo, donation) {
  const reasons = [];
  const acceptedCategories = parsePreference(ngo.foodPreference);

  if (!ngo) {
    return { eligible: false, reasons: ['No NGO record.'], acceptedCategories };
  }

  if (ngo.verificationStatus !== 'VERIFIED') {
    reasons.push('Not yet verified.');
  }
  if (ngo.isAccepting !== true) {
    reasons.push('Not currently accepting donations.');
  }
  if (!hasCoordinates(ngo)) {
    reasons.push('No location on file.');
  }

  const requiredKg = toKilograms(donation.quantity, donation.quantityUnit);
  const capacity = Number(ngo.storageCapacity);
  if (!Number.isFinite(capacity) || capacity <= 0) {
    reasons.push('No storage capacity recorded.');
  } else if (capacity < requiredKg * 0.5) {
    // Less than half the batch: not a realistic single recipient.
    reasons.push('Storage capacity is too small for this batch.');
  }

  if (isVegetarianOnly(acceptedCategories) && donation.foodType === 'NON_VEG') {
    reasons.push('This kitchen handles vegetarian food only.');
  }

  return { eligible: reasons.length === 0, reasons, acceptedCategories };
}

// ---------------------------------------------------------------------------
// 2. Scoring
// ---------------------------------------------------------------------------

/**
 * @returns {{
 *   ngoId: number,
 *   score: number,
 *   distanceKm: number|null,
 *   breakdown: { capacity: number, compatibility: number, distance: number, collection: number },
 *   explanation: string
 * }}
 */
function scoreNgo(donation, ngo, now = new Date()) {
  const acceptedCategories = parsePreference(ngo.foodPreference);
  const requiredKg = toKilograms(donation.quantity, donation.quantityUnit);
  const capacityKg = Number(ngo.storageCapacity);

  // --- Capacity suitability (30%) ----------------------------------------
  // Full marks when the kitchen can hold the whole batch, tapering as the
  // batch approaches its capacity.
  const capacityScore = clamp01(capacityKg / Math.max(requiredKg, 0.001));

  // --- Food compatibility (25%) ------------------------------------------
  // An NGO with no stated preference is treated as neutral, not as a refusal.
  let compatibilityScore;
  if (acceptedCategories.length === 0) {
    compatibilityScore = 0.6;
  } else if (acceptedCategories.includes(donation.foodCategory)) {
    compatibilityScore = 1;
  } else {
    compatibilityScore = 0.15;
  }

  // --- Distance (25%) -----------------------------------------------------
  const distanceKm = hasCoordinates(donation) && hasCoordinates(ngo)
    ? haversineKm(donation, ngo)
    : null;
  const distanceScore = distanceKm === null ? 0 : clamp01(1 - distanceKm / MAX_DISTANCE_KM);

  // --- Collection-time feasibility (20%) ---------------------------------
  const remainingMinutes = (new Date(donation.expiryTime).getTime() - now.getTime()) / MINUTE_MS;
  const transitMinutes = distanceKm === null ? 0 : (distanceKm / AVG_SPEED_KMH) * 60;
  const requiredMinutes = transitMinutes + HANDLING_MINUTES;
  // Full marks once there is 50% more time than the trip needs; 0 when the trip
  // would only just fit (or not fit at all).
  const collectionScore = clamp01(remainingMinutes / (requiredMinutes * 1.5));

  const score =
    Math.round(
      (WEIGHTS.capacity * capacityScore +
        WEIGHTS.compatibility * compatibilityScore +
        WEIGHTS.distance * distanceScore +
        WEIGHTS.collection * collectionScore) *
        100 *
        100
    ) / 100;

  return {
    ngoId: ngo.id,
    score,
    distanceKm,
    breakdown: {
      capacity: Math.round(capacityScore * 100),
      compatibility: Math.round(compatibilityScore * 100),
      distance: Math.round(distanceScore * 100),
      collection: Math.round(collectionScore * 100),
    },
    explanation: explain({
      ngo,
      donation,
      distanceKm,
      capacityKg,
      requiredKg,
      acceptedCategories,
      remainingMinutes,
      requiredMinutes,
    }),
  };
}

/**
 * One sentence naming the real numbers behind the score, so the ranking is
 * explainable (PRD FR-07: "The system explains why an NGO is recommended").
 */
function explain({
  ngo,
  donation,
  distanceKm,
  capacityKg,
  requiredKg,
  acceptedCategories,
  remainingMinutes,
  requiredMinutes,
}) {
  const name = ngo.organizationName || 'This NGO';
  const parts = [];

  if (distanceKm !== null) {
    parts.push(`is ${distanceKm} km away`);
  } else {
    parts.push('has no location on file');
  }

  if (acceptedCategories.length === 0) {
    parts.push('has no stated category preference');
  } else if (acceptedCategories.includes(donation.foodCategory)) {
    parts.push(`already accepts ${donation.foodCategory}`);
  } else {
    parts.push(`does not list ${donation.foodCategory} as an accepted category`);
  }

  if (Number.isFinite(capacityKg)) {
    const fits = capacityKg >= requiredKg;
    parts.push(
      fits
        ? `can hold the full ~${Math.round(requiredKg)} kg batch (${Math.round(capacityKg)} kg/day capacity)`
        : `can hold part of the ~${Math.round(requiredKg)} kg batch (${Math.round(capacityKg)} kg/day capacity)`
    );
  }

  const spare = Math.round(remainingMinutes - requiredMinutes);
  if (spare > 0) {
    parts.push(`and has about ${formatMinutes(spare)} to spare before the deadline`);
  } else {
    parts.push('and would struggle to reach the deadline in time');
  }

  return `${name} ${parts.join(', ')}.`;
}

function formatMinutes(minutes) {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

// ---------------------------------------------------------------------------
// 3. Ranking
// ---------------------------------------------------------------------------

/**
 * Filter, score and rank every NGO for one donation.
 *
 * @param {object} donation
 * @param {object[]} ngos
 * @param {Date} [now]
 * @returns {{
 *   eligible: boolean,
 *   reasons: string[],
 *   recommendations: Array<ReturnType<typeof scoreNgo> & { ngo: object }>
 * }}
 */
function rankNgos(donation, ngos = [], now = new Date()) {
  const donationCheck = checkDonationEligibility(donation, now);
  if (!donationCheck.eligible) {
    return { eligible: false, reasons: donationCheck.reasons, recommendations: [] };
  }

  const recommendations = [];

  for (const ngo of ngos) {
    const ngoCheck = checkNgoEligibility(ngo, donation);
    if (!ngoCheck.eligible) continue;
    recommendations.push({ ...scoreNgo(donation, ngo, now), ngo });
  }

  recommendations.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break: the nearer NGO wins.
    return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
  });

  return { eligible: true, reasons: [], recommendations };
}

module.exports = {
  WEIGHTS,
  UNIT_TO_KG,
  MAX_DISTANCE_KM,
  AVG_SPEED_KMH,
  HANDLING_MINUTES,
  toKilograms,
  parsePreference,
  isVegetarianOnly,
  checkDonationEligibility,
  checkNgoEligibility,
  scoreNgo,
  rankNgos,
};
