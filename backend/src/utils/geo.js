/**
 * Geographical helpers for the matching engine (PRD FR-08).
 *
 * Distance is the great-circle distance between two points, calculated with the
 * Haversine formula. PRD FR-08 is explicit that the system must not invent
 * coordinates: `hasCoordinates` is how callers decide whether a point is usable,
 * and anything without a usable point is skipped rather than defaulted to
 * (0, 0) — which would place it off the coast of Africa and quietly corrupt the
 * distance score.
 */

/** Mean Earth radius in kilometres. */
const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * True when a point carries a usable numeric latitude and longitude.
 * Prisma returns DECIMAL columns as strings, so `Number()` is applied first.
 *
 * @param {{ latitude?: any, longitude?: any } | null | undefined} point
 */
function hasCoordinates(point) {
  if (!point) return false;

  const { latitude, longitude } = point;
  // Prisma returns DECIMAL as a string, but a missing value is null — and
  // `Number(null)` is 0, which would silently place the point at (0, 0).
  if (latitude === null || latitude === undefined || latitude === '') return false;
  if (longitude === null || longitude === undefined || longitude === '') return false;

  const lat = Number(latitude);
  const lng = Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Great-circle distance in kilometres.
 *
 * @param {{ latitude: any, longitude: any }} from
 * @param {{ latitude: any, longitude: any }} to
 * @returns {number} kilometres, rounded to two decimals
 * @throws {TypeError} when either point has no usable coordinates
 */
function haversineKm(from, to) {
  if (!hasCoordinates(from) || !hasCoordinates(to)) {
    throw new TypeError('haversineKm needs two points with numeric latitude and longitude.');
  }

  const lat1 = toRadians(Number(from.latitude));
  const lat2 = toRadians(Number(to.latitude));
  const deltaLat = toRadians(Number(to.latitude) - Number(from.latitude));
  const deltaLng = toRadians(Number(to.longitude) - Number(from.longitude));

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
  return Math.round(distance * 100) / 100;
}

module.exports = { EARTH_RADIUS_KM, hasCoordinates, haversineKm };
