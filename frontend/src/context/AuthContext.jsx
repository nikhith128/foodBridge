import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { fetchMe, loginUser, registerUser } from '../services/auth.service.js';
import { setUnauthorizedHandler } from '../services/api.js';
import { clearToken, getToken, setToken } from '../utils/tokenStore.js';
import { useToast } from './ToastContext.jsx';

/**
 * AuthContext — the app's single source of truth for "who is signed in".
 *
 * status is one of:
 *   'booting'       the stored token is still being checked with GET /auth/me
 *   'authenticated' `user` is loaded
 *   'anonymous'     there is no valid session
 *
 * The three states are distinct on purpose: a reload must not be mistaken for a
 * signed-out visitor, which is why the guards wait for 'booting' to finish.
 *
 * The JWT lives in localStorage (Step B decision) and is sent as
 * "Authorization: Bearer <token>" by services/api.js.
 */

export const AuthContext = createContext(null);

export const AUTH_STATUS = {
  BOOTING: 'booting',
  AUTHENTICATED: 'authenticated',
  ANONYMOUS: 'anonymous',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(AUTH_STATUS.BOOTING);

  const { error: raiseError, success: raiseSuccess } = useToast();

  // The toast helpers are recreated whenever the toast stack changes. Holding
  // them in a ref keeps the long-lived callbacks below from going stale without
  // re-registering them on every render.
  const toastRef = useRef({ raiseError, raiseSuccess });
  useEffect(() => {
    toastRef.current = { raiseError, raiseSuccess };
  });

  const endSession = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus(AUTH_STATUS.ANONYMOUS);
  }, []);

  // --- A rejected token anywhere in the app ends the session --------------
  // Registered before the boot effect below, so the very first /auth/me call is
  // already covered.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      endSession();
      toastRef.current.raiseError?.('Your session expired. Please log in again.');
    });

    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  // --- Boot: is the stored token still good? ------------------------------
  useEffect(() => {
    let cancelled = false;

    if (!getToken()) {
      setStatus(AUTH_STATUS.ANONYMOUS);
      return undefined;
    }

    (async () => {
      try {
        const data = await fetchMe();
        if (cancelled) return;
        setUser(data.user);
        setStatus(AUTH_STATUS.AUTHENTICATED);
      } catch {
        // Invalid, expired or the account was deleted. Either way: no session.
        if (cancelled) return;
        endSession();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [endSession]);

  const applySession = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);
    setStatus(AUTH_STATUS.AUTHENTICATED);
    return data.user;
  }, []);

  const login = useCallback(
    async (credentials) => applySession(await loginUser(credentials)),
    [applySession]
  );

  const register = useCallback(
    async (payload) => applySession(await registerUser(payload)),
    [applySession]
  );

  const logout = useCallback(
    ({ silent = false } = {}) => {
      endSession();
      if (!silent) toastRef.current.raiseSuccess?.('Signed out.');
    },
    [endSession]
  );

  /**
   * Merge session-only edits into the signed-in user.
   *
   * The backend has no profile-update endpoint yet (auth.routes.js only has
   * register / login / me), so Edit Profile and Settings keep their changes in
   * memory. A reload deliberately restores the values /auth/me returns. `ngo`
   * is merged one level deep so a caller can patch one organisation field
   * without rebuilding the whole object.
   */
  const updateUser = useCallback((patch) => {
    setUser((current) => {
      if (!current) return current;
      const next = typeof patch === 'function' ? patch(current) : patch;
      if (!next) return current;

      const { ngo, ...rest } = next;
      return {
        ...current,
        ...rest,
        ...(ngo ? { ngo: { ...(current.ngo || {}), ...ngo } } : {}),
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === AUTH_STATUS.AUTHENTICATED,
      isBooting: status === AUTH_STATUS.BOOTING,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, status, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>. It is mounted in App.jsx.');
  }
  return context;
}

export default AuthProvider;
