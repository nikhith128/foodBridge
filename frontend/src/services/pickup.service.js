/**
 * Pickup endpoints.
 *
 * One function per route in backend/src/routes/pickups.routes.js:
 *   GET   /api/pickups             -> 200 { status, count, pickups }
 *   PATCH /api/pickups/:id/status  -> 200 { status, message, pickup }
 *
 * Failures throw ApiError (see services/api.js).
 */

import { request } from './api.js';

/** Every pickup this NGO owns. `status` optionally narrows to one step. */
export function listPickups({ status } = {}) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/pickups${query}`);
}

/**
 * Advance a pickup one step. Only the single legal next status is accepted by
 * the API; anything else is a 409.
 */
export function updatePickupStatus(id, status) {
  return request(`/pickups/${id}/status`, { method: 'PATCH', body: { status } });
}
