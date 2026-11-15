/**
 * Donation and matching endpoints.
 *
 * One function per route in backend/src/routes/donations.routes.js and
 * backend/src/routes/matches.routes.js, so a page never has to remember a path
 * or a verb.
 *
 * The API contract these mirror:
 *   POST  /api/donations              -> 201 { status, message, donation }
 *   GET   /api/donations              -> 200 { status, count, donations }
 *   GET   /api/donations/:id          -> 200 { status, donation }
 *   PATCH /api/donations/:id/cancel   -> 200 { status, message, donation }
 *   GET   /api/matches/:donationId    -> 200 { status, eligible, reasons, donation,
 *                                              weights, count, recommendations }
 *
 * Failures throw ApiError (see services/api.js).
 */

import { request } from './api.js';

/** Publish a donation. Donor accounts only — the API returns 403 otherwise. */
export function createDonation(payload) {
  return request('/donations', { method: 'POST', body: payload });
}

/**
 * List donations. The API decides the scope from the caller's role: a donor
 * sees their own at every status, an NGO or volunteer sees only what is still
 * available. `status` optionally narrows to one stored status.
 */
export function listDonations({ status } = {}) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/donations${query}`);
}

/** One donation, subject to the API's access rules. */
export function getDonation(id) {
  return request(`/donations/${id}`);
}

/** Withdraw an unclaimed donation. Returns 409 once it has been claimed. */
export function cancelDonation(id) {
  return request(`/donations/${id}/cancel`, { method: 'PATCH' });
}

/**
 * The ranked NGO recommendations for one donation, with the factor breakdown
 * and explanation behind each score.
 */
export function getMatches(donationId) {
  return request(`/matches/${donationId}`);
}

/**
 * Claim a recommended donation. Takes the `matchId` from GET /api/matches/:id
 * (donor) or from the donation detail's `myMatch` (NGO). The API refuses a
 * second claim with 409, so the UI must treat that as a normal outcome.
 */
export function acceptMatch(matchId) {
  return request(`/matches/${matchId}/accept`, { method: 'POST' });
}
