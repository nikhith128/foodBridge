/**
 * Impact endpoint.
 *
 * One function for the one route in backend/src/routes/impact.routes.js:
 *   GET /api/impact?range=7d|30d|all  -> 200 { status, scope, range, sampleData,
 *                                              generatedAt, summary, mealsOverTime,
 *                                              donationsByStatus, donationsByCategory,
 *                                              topContributors, recentCompleted, volunteer }
 *
 * The API scopes the rows from the caller's role, so the page never has to say
 * whose impact it is asking for. Failures throw ApiError (see services/api.js).
 */

import { request } from './api.js';

/** The three ranges the Impact Dashboard offers, and the API's default. */
export const IMPACT_RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
];

/**
 * The role-aware impact summary. `range` is one of '7d' | '30d' | 'all'; the
 * API normalises anything else to 'all'.
 */
export function getImpact({ range = 'all' } = {}) {
  const query = range ? `?range=${encodeURIComponent(range)}` : '';
  return request(`/impact${query}`);
}
