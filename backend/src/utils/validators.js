/**
 * Hand-rolled validation helpers.
 *
 * Deliberately dependency-free: Phases.md says no new library without asking,
 * and auth only needs email / password / required-field checks.
 *
 * Every validator returns { errors, data }:
 *   errors -> [{ field, message }]  (empty array when valid)
 *   data   -> normalised, trimmed values ready for Prisma
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ROLES = ['DONOR', 'NGO', 'VOLUNTEER'];

// Facility types offered on the Register screen ("Donor Facility Type").
const DONOR_TYPES = [
  'Restaurant / Bistro',
  'Hotel & Hospitality',
  'Artisan Bakery / Cafe',
  'Supermarket / Grocer',
  'College / Corporate Canteen',
  'Event Organizer / Catering',
  'Individual Donor',
];

// "Accepted Food Categories" on the Register screen. Donations use these same
// strings so Step C's compatibility check can compare them exactly.
const FOOD_CATEGORIES = [
  'Cooked Hot Meals',
  'Fresh Produce',
  'Bakery & Bread',
  'Packaged Goods',
  'Vegetarian Only',
];

const AVAILABILITY_WINDOWS = ['Weekdays', 'Weekends', 'Mornings', 'Evenings'];

// PRD FR-04 requires a vegetarian / non-vegetarian flag.
const FOOD_TYPES = ['VEG', 'NON_VEG'];

// Units a donation's quantity can be expressed in. The matching engine converts
// these to an approximate kilogram figure before comparing against an NGO's
// kg/day capacity (see services/matching.service.js).
const QUANTITY_UNITS = ['kg', 'servings', 'crates', 'trays', 'packets'];

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** Accepts an array of strings or a comma-separated string; returns "a, b". */
function asList(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => item.trim())
      .join(', ');
  }
  return asString(value);
}

function isEmail(value) {
  return EMAIL_PATTERN.test(asString(value).toLowerCase());
}

/**
 * Matches the hint printed on the Register screen:
 * "At least 8 characters, with letters and numbers".
 */
function isPasswordStrongEnough(value) {
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    /[A-Za-z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

function isNonNegativeNumber(value) {
  if (value === '' || value === null || value === undefined) return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

/** True when every value in `list` is one of `allowed`. */
function allInList(value, allowed) {
  const parts = asList(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 && parts.every((part) => allowed.includes(part));
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

function validateRegister(body = {}) {
  const errors = [];

  const name = asString(body.name);
  const email = asString(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const role = asString(body.role).toUpperCase();
  const phone = asString(body.phone);

  if (name.length < 2 || name.length > 150) {
    errors.push({ field: 'name', message: 'Name must be between 2 and 150 characters.' });
  }
  if (!isEmail(email)) {
    errors.push({ field: 'email', message: 'Enter a valid email address.' });
  }
  if (!isPasswordStrongEnough(password)) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters and include a letter and a number.',
    });
  }
  if (!ROLES.includes(role)) {
    errors.push({ field: 'role', message: `Role must be one of: ${ROLES.join(', ')}.` });
  }
  if (phone && (phone.length < 6 || phone.length > 30)) {
    errors.push({ field: 'phone', message: 'Enter a valid phone number.' });
  }

  // --- Role-specific -------------------------------------------------------
  let organizationName = null;
  let donorType = null;
  let city = null;
  let availability = null;
  let hasVehicle = false;
  let address = null;
  let storageCapacity = null;
  let capacityNotes = null;
  let foodPreference = null;

  if (role === 'DONOR') {
    organizationName = asString(body.organizationName) || null;
    donorType = asString(body.donorType) || null;
    if (organizationName && organizationName.length > 190) {
      errors.push({ field: 'organizationName', message: 'Organisation name is too long.' });
    }
    if (donorType && !DONOR_TYPES.includes(donorType)) {
      errors.push({
        field: 'donorType',
        message: `Facility type must be one of: ${DONOR_TYPES.join(', ')}.`,
      });
    }
  }

  if (role === 'NGO') {
    organizationName = asString(body.organizationName);
    address = asString(body.address);
    capacityNotes = asString(body.capacityNotes) || null;
    foodPreference = asList(body.foodPreference) || null;

    if (organizationName.length < 2 || organizationName.length > 190) {
      errors.push({
        field: 'organizationName',
        message: 'Registered organisation name must be between 2 and 190 characters.',
      });
    }
    if (address.length < 5 || address.length > 500) {
      errors.push({
        field: 'address',
        message: 'Operating address is required (at least 5 characters).',
      });
    }
    if (!isNonNegativeNumber(body.storageCapacity)) {
      errors.push({
        field: 'storageCapacity',
        message: 'Storage capacity must be a number of 0 or more (in kg per day).',
      });
    } else {
      storageCapacity = Number(body.storageCapacity);
    }
    if (foodPreference && !allInList(foodPreference, FOOD_CATEGORIES)) {
      errors.push({
        field: 'foodPreference',
        message: `Accepted categories must come from: ${FOOD_CATEGORIES.join(', ')}.`,
      });
    }
  }

  if (role === 'VOLUNTEER') {
    city = asString(body.city) || null;
    availability = asList(body.availability) || null;
    hasVehicle = body.hasVehicle === true || body.hasVehicle === 'true';

    if (city && city.length > 120) {
      errors.push({ field: 'city', message: 'City name is too long.' });
    }
    if (availability && !allInList(availability, AVAILABILITY_WINDOWS)) {
      errors.push({
        field: 'availability',
        message: `Availability must come from: ${AVAILABILITY_WINDOWS.join(', ')}.`,
      });
    }
  }

  return {
    errors,
    data: {
      name,
      email,
      password,
      role,
      phone: phone || null,
      organizationName,
      donorType,
      city,
      availability,
      hasVehicle,
      address,
      storageCapacity,
      capacityNotes,
      foodPreference,
    },
  };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

function validateLogin(body = {}) {
  const errors = [];
  const email = asString(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';

  if (!isEmail(email)) {
    errors.push({ field: 'email', message: 'Enter a valid email address.' });
  }
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required.' });
  }

  return { errors, data: { email, password } };
}

// ---------------------------------------------------------------------------
// Donation
// ---------------------------------------------------------------------------

/** Parses a date-ish value; returns null when it is not a real date. */
function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inRange(value, min, max) {
  if (value === '' || value === null || value === undefined) return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

/**
 * Validates a new donation.
 *
 * PRD FR-04 / Phases.md Step C: preparation time, storage condition and a future
 * collection deadline are the mandatory safety fields. A donation missing any of
 * them is rejected here, so it can never reach the matching engine.
 *
 * Dates arrive as ISO strings from the browser (datetime-local inputs).
 */
function validateDonation(body = {}) {
  const errors = [];
  const now = Date.now();

  const foodName = asString(body.foodName);
  const foodCategory = asString(body.foodCategory);
  const foodType = asString(body.foodType).toUpperCase();
  const quantityUnit = asString(body.quantityUnit).toLowerCase() || 'kg';
  const storageCondition = asString(body.storageCondition);
  const description = asString(body.description);

  const preparationTime = parseDate(body.preparationTime);
  const expiryTime = parseDate(body.expiryTime);

  if (foodName.length < 2 || foodName.length > 190) {
    errors.push({ field: 'foodName', message: 'Food name must be between 2 and 190 characters.' });
  }

  if (!FOOD_CATEGORIES.includes(foodCategory)) {
    errors.push({
      field: 'foodCategory',
      message: `Food category must be one of: ${FOOD_CATEGORIES.join(', ')}.`,
    });
  }

  if (!FOOD_TYPES.includes(foodType)) {
    errors.push({ field: 'foodType', message: `Food type must be one of: ${FOOD_TYPES.join(', ')}.` });
  }

  let quantity = null;
  if (!isNonNegativeNumber(body.quantity) || Number(body.quantity) <= 0) {
    errors.push({ field: 'quantity', message: 'Quantity must be a number greater than 0.' });
  } else {
    quantity = Number(body.quantity);
  }

  if (!QUANTITY_UNITS.includes(quantityUnit)) {
    errors.push({
      field: 'quantityUnit',
      message: `Quantity unit must be one of: ${QUANTITY_UNITS.join(', ')}.`,
    });
  }

  if (!preparationTime) {
    errors.push({ field: 'preparationTime', message: 'Preparation date and time is required.' });
  } else if (preparationTime.getTime() > now + 5 * 60 * 1000) {
    // A small skew is allowed so a clock a few seconds ahead is not punished.
    errors.push({ field: 'preparationTime', message: 'Preparation time cannot be in the future.' });
  }

  if (storageCondition.length < 2 || storageCondition.length > 190) {
    errors.push({
      field: 'storageCondition',
      message: 'Describe how the food is being stored (2 to 190 characters).',
    });
  }

  if (!expiryTime) {
    errors.push({ field: 'expiryTime', message: 'A collection deadline is required.' });
  } else if (expiryTime.getTime() <= now) {
    errors.push({ field: 'expiryTime', message: 'The collection deadline must be in the future.' });
  } else if (preparationTime && expiryTime.getTime() <= preparationTime.getTime()) {
    errors.push({
      field: 'expiryTime',
      message: 'The collection deadline must be after the preparation time.',
    });
  }

  // Pickup location is required information (PRD FR-04): the distance factor is
  // a quarter of the matching score, and FR-08 forbids inventing coordinates.
  const hasLat = body.latitude !== '' && body.latitude !== null && body.latitude !== undefined;
  const hasLng = body.longitude !== '' && body.longitude !== null && body.longitude !== undefined;
  let latitude = null;
  let longitude = null;

  if (!hasLat || !hasLng) {
    errors.push({
      field: 'latitude',
      message: 'Pickup latitude and longitude are both required.',
    });
  } else {
    if (!inRange(body.latitude, -90, 90)) {
      errors.push({ field: 'latitude', message: 'Latitude must be between -90 and 90.' });
    } else {
      latitude = Number(body.latitude);
    }
    if (!inRange(body.longitude, -180, 180)) {
      errors.push({ field: 'longitude', message: 'Longitude must be between -180 and 180.' });
    } else {
      longitude = Number(body.longitude);
    }
  }

  if (description.length > 1000) {
    errors.push({ field: 'description', message: 'Description must be 1000 characters or fewer.' });
  }

  return {
    errors,
    data: {
      foodName,
      foodCategory,
      foodType,
      quantity,
      quantityUnit,
      preparationTime,
      storageCondition,
      expiryTime,
      latitude,
      longitude,
      description: description || null,
    },
  };
}

module.exports = {
  ROLES,
  DONOR_TYPES,
  FOOD_CATEGORIES,
  FOOD_TYPES,
  QUANTITY_UNITS,
  AVAILABILITY_WINDOWS,
  validateRegister,
  validateLogin,
  validateDonation,
};
