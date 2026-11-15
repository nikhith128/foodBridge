/**
 * The one place the JWT is read, written and cleared.
 *
 * Nothing else in the app touches localStorage. Keeping the key and the
 * storage mechanics here means the auth decision ("is there a session?") has a
 * single answer, and swapping to httpOnly cookies later is a one-file change.
 *
 * `localStorage` is not available when the app is rendered outside a browser
 * (the Node smoke tests), so a small in-memory fallback keeps the module usable
 * in both places. The browser is always preferred when it exists.
 */

export const TOKEN_STORAGE_KEY = 'foodbridge.auth.token';

// Fallback for environments without localStorage. Always mirrors the last write.
let memoryToken = null;

function getStorage() {
  try {
    const storage = globalThis.localStorage;
    if (storage && typeof storage.getItem === 'function') return storage;
  } catch {
    // Accessing localStorage throws in some privacy / blocked-cookie modes.
  }
  return null;
}

/** The stored token, or null. */
export function getToken() {
  const storage = getStorage();
  if (storage) {
    try {
      const stored = storage.getItem(TOKEN_STORAGE_KEY);
      if (stored !== null) return stored;
    } catch {
      // Fall through to the in-memory copy.
    }
  }
  return memoryToken;
}

/** Stores the token. Passing an empty value clears it instead. */
export function setToken(token) {
  if (!token) {
    clearToken();
    return null;
  }

  memoryToken = token;

  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // Quota exceeded or storage disabled: the in-memory copy still works for
      // this tab, so the user stays signed in until they reload.
    }
  }

  return token;
}

/** Removes the token from both storages. */
export function clearToken() {
  memoryToken = null;

  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Nothing useful to do: the memory copy is already cleared.
    }
  }
}

/** True when a session token is present. Does not validate it. */
export function hasToken() {
  return Boolean(getToken());
}
