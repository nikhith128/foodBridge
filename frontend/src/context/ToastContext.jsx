import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

/**
 * ToastContext — the one place the app raises a toast.
 *
 *   const { success, error, info } = useToast();
 *   success('Donation published.');
 *
 * Design.md section 11 requires a Success toast on every relevant page, and
 * section 11's system states list is why this lives in context rather than in
 * each page: no page should own its own toast state.
 */

const ToastContext = createContext(null);

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({ message, variant = 'success', duration = DEFAULT_DURATION, title }) => {
      const id = `toast-${nextId.current}`;
      nextId.current += 1;

      setToasts((current) => [...current, { id, message, variant, title }]);

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toasts,
      push,
      dismiss,
      success: (message, options) => push({ message, variant: 'success', ...options }),
      error: (message, options) => push({ message, variant: 'error', ...options }),
      info: (message, options) => push({ message, variant: 'info', ...options }),
      warning: (message, options) => push({ message, variant: 'warning', ...options }),
    }),
    [toasts, push, dismiss]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside <ToastProvider>. Wrap your routes in App.jsx.');
  }
  return context;
}

export default ToastContext;
