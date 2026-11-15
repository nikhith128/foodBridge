/**
 * The single entry point to the backend API.
 *
 * Responsibilities, and nothing more:
 *   1. resolve the base URL (Vite proxy by default, VITE_API_URL to override)
 *   2. attach the stored Bearer token
 *   3. send and parse JSON
 *   4. turn every failure into an ApiError carrying { status, message, errors }
 *   5. report a rejected *session* (401) to the one global handler
 *
 * It deliberately knows nothing about React. AuthContext registers the 401
 * handler; everything else just calls `request` / `api.get` / `api.post`.
 */

import { getToken } from '../utils/tokenStore.js';

// Vite replaces `import.meta.env` at build time. The `&&` form keeps this file
// loadable under plain Node too, where `import.meta.env` is undefined.
const RAW_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || '/api';

/** Base URL actually used, without a trailing slash. Exported for the tests. */
export const API_BASE_URL = RAW_BASE.endsWith('/') ? RAW_BASE.slice(0, -1) : RAW_BASE;

/**
 * Every non-2xx response and every transport failure arrives as one of these,
 * so callers only ever need a single catch.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, errors = [], cause } = {}) {
    super(message);
    this.name = 'ApiError';
    /** HTTP status, or 0 when the request never reached the server. */
    this.status = status;
    /** [{ field, message }] from the API's validation responses. */
    this.errors = Array.isArray(errors) ? errors : [];
    if (cause !== undefined) this.cause = cause;
  }

  /** The message the API attached to one field, or null. */
  fieldError(field) {
    const match = this.errors.find((entry) => entry && entry.field === field);
    return match ? match.message : null;
  }

  /** True when the backend could not be reached at all. */
  get isNetworkError() {
    return this.status === 0;
  }
}

// --- Global 401 handling ----------------------------------------------------

let unauthorizedHandler = null;

/**
 * Registers the callback fired when a request is rejected with 401 while a
 * token was sent. AuthContext uses this to clear the session and toast.
 * Passing anything that is not a function unregisters the handler.
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

export function getUnauthorizedHandler() {
  return unauthorizedHandler;
}

// --- Request ----------------------------------------------------------------

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * @param {string} path                    e.g. '/auth/login'
 * @param {object} [options]
 * @param {string} [options.method]        default 'GET'
 * @param {any}    [options.body]          serialised to JSON
 * @param {object} [options.headers]       merged over the defaults
 * @param {string|null} [options.token]    null = send none, omit = use the session
 * @param {boolean} [options.skipAuthRedirect] true for the login form, whose
 *        401 means "wrong password", not "your session expired"
 */
export async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers: extraHeaders,
    token,
    skipAuthRedirect = false,
    signal,
  } = options;

  const authToken = token === undefined ? getToken() : token;

  const headers = { Accept: 'application/json', ...extraHeaders };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let payload;
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
    payload = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(buildUrl(path), { method, headers, body: payload, signal });
  } catch (cause) {
    throw new ApiError('Could not reach the server. Check that the backend is running.', {
      status: 0,
      cause,
    });
  }

  // Read as text first so an empty body (204, or a crashed proxy) is not a
  // JSON parse crash.
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const error = new ApiError(
      (data && data.message) || `Request failed with status ${response.status}.`,
      { status: response.status, errors: data && data.errors }
    );

    // Only a rejected *session* ends the session:
    //   - the login form's 401 means "wrong password"
    //   - an anonymous request has no session to expire
    if (response.status === 401 && !skipAuthRedirect && authToken && unauthorizedHandler) {
      try {
        unauthorizedHandler(error);
      } catch {
        // A broken handler must never hide the real error from the caller.
      }
    }

    throw error;
  }

  return data;
}

/** Thin verb helpers, for readability at the call sites. */
export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default request;
