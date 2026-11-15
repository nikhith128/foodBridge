/**
 * Option lists shared by the Register form and the UI gallery.
 *
 * These mirror the arrays the backend validates against in
 * `backend/src/utils/validators.js`. They are duplicated here on purpose: the
 * frontend must not import from the backend folder, and the API is the real
 * authority — the server returns 400 if these ever drift out of sync.
 *
 * If you change a list here, change it in backend/src/utils/validators.js too.
 */

export const ROLES = [
  { value: 'DONOR', label: 'Donor' },
  { value: 'NGO', label: 'NGO' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
];

export const DONOR_TYPES = [
  'Restaurant / Bistro',
  'Hotel & Hospitality',
  'Artisan Bakery / Cafe',
  'Supermarket / Grocer',
  'College / Corporate Canteen',
  'Event Organizer / Catering',
  'Individual Donor',
];

export const FOOD_CATEGORIES = [
  'Cooked Hot Meals',
  'Fresh Produce',
  'Bakery & Bread',
  'Packaged Goods',
  'Vegetarian Only',
];

export const AVAILABILITY_WINDOWS = ['Weekdays', 'Weekends', 'Mornings', 'Evenings'];

export const PASSWORD_HINT = 'At least 8 characters, with letters and numbers';

// ---------------------------------------------------------------------------
// Donations (Step C)
// ---------------------------------------------------------------------------

/**
 * PRD FR-04: "Vegetarian or non-vegetarian type". Mirrors FOOD_TYPES in
 * backend/src/utils/validators.js.
 */
export const FOOD_TYPES = [
  { value: 'VEG', label: 'Vegetarian' },
  { value: 'NON_VEG', label: 'Non-Vegetarian' },
];

/**
 * Units a donation's quantity can be given in. Mirrors QUANTITY_UNITS in
 * backend/src/utils/validators.js.
 */
export const QUANTITY_UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'servings', label: 'Servings (approx. 400 g each)' },
  { value: 'crates', label: 'Crates (approx. 15 kg each)' },
  { value: 'trays', label: 'Catering trays (approx. 5 kg each)' },
  { value: 'packets', label: 'Meal packets (approx. 0.5 kg each)' },
];

/**
 * PRD FR-04: "Storage information". Free text is accepted by the API; these are
 * the standard options the screens offer, and the donor may type their own.
 */
export const STORAGE_CONDITIONS = [
  'Hot holding above 60°C',
  'Refrigerated below 4°C',
  'Ambient / room temperature',
  'Deep frozen below -18°C',
];

/**
 * Approximate kilograms per unit, so the form can show a rough batch weight.
 * This mirrors UNIT_TO_KG in backend/src/services/matching.service.js — the
 * server is the authority; this copy only drives the live preview, and every
 * figure it produces is labelled as an estimate.
 */
export const UNIT_TO_KG = {
  kg: 1,
  servings: 0.4,
  crates: 15,
  trays: 5,
  packets: 0.5,
};

/**
 * The default pickup point the create form is prefilled with. It is the same
 * placeholder the seed uses, inside the demo city area — never a real address.
 * The donor can replace it before publishing.
 */
export const DEMO_PICKUP_ORIGIN = { latitude: 17.385044, longitude: 78.486671 };
