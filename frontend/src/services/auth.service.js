/**
 * Auth endpoints. One function per route in backend/src/routes/auth.routes.js,
 * so a page never has to remember a path or a verb.
 *
 * The API contract these mirror:
 *   POST /api/auth/register  -> 201 { status, message, token, user }
 *   POST /api/auth/login     -> 200 { status, message, token, user }
 *   GET  /api/auth/me        -> 200 { status, user }
 *
 * Failures throw ApiError (see services/api.js).
 */

import { request } from './api.js';

// Register and login are public: they must not send a stale token, and their
// 401 (login only) means "wrong password", never "session expired".
const AS_ANONYMOUS = { token: null, skipAuthRedirect: true };

export function registerUser(payload) {
  return request('/auth/register', { method: 'POST', body: payload, ...AS_ANONYMOUS });
}

export function loginUser(credentials) {
  return request('/auth/login', { method: 'POST', body: credentials, ...AS_ANONYMOUS });
}

export function fetchMe() {
  return request('/auth/me');
}
