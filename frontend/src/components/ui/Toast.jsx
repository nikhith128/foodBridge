import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

import { cn } from '../../utils/cn.js';
import { useToast } from '../../context/ToastContext.jsx';

/**
 * Toast
 *
 * The visual is lifted straight from the feedback toast on the Volunteer
 * Dashboard screen:
 *   fixed bottom-24 left-4 right-4 bg-primary text-on-primary p-3 rounded-xl
 *   shadow-xl flex items-center justify-between gap-2
 * with the message truncated and a 40x40 close target.
 *
 * The screens only ever show the success variant (dark green with a
 * `text-secondary-fixed` tick). Error / warning / info are derived from the
 * same pattern using the existing tokens, since Design.md section 11 asks for
 * a toast on every page and not every toast is a success.
 *
 * `bottom-24` clears the volunteer mobile bottom navigation bar.
 */

const VARIANTS = {
  success: {
    container: 'bg-primary text-on-primary',
    icon: CheckCircle2,
    iconColour: 'text-secondary-fixed',
    role: 'status',
  },
  error: {
    container: 'bg-error-container text-on-error-container',
    icon: AlertCircle,
    iconColour: 'text-error',
    role: 'alert',
  },
  warning: {
    container: 'bg-tertiary-fixed text-tertiary',
    icon: AlertTriangle,
    iconColour: 'text-tertiary',
    role: 'alert',
  },
  info: {
    container: 'bg-inverse-surface text-inverse-on-surface',
    icon: Info,
    iconColour: 'text-secondary-fixed',
    role: 'status',
  },
};

export function Toast({ variant = 'success', title, message, onDismiss, className }) {
  const preset = VARIANTS[variant] || VARIANTS.info;
  const Icon = preset.icon;

  return (
    <div
      role={preset.role}
      aria-live={preset.role === 'alert' ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto flex items-center justify-between gap-2 rounded-xl p-3 shadow-overlay',
        preset.container,
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Icon className={cn('h-5 w-5 shrink-0', preset.iconColour)} aria-hidden="true" />
        <div className="flex min-w-0 flex-col">
          {title && <span className="font-label-md text-label-md truncate">{title}</span>}
          <span
            className={cn(
              'font-label-md text-label-md',
              title ? 'font-normal opacity-90' : 'truncate'
            )}
          >
            {message}
          </span>
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg opacity-80',
            'transition-opacity hover:opacity-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current'
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * Renders the stack held by ToastContext. Mounted once, inside <ToastProvider>,
 * next to the router in App.jsx.
 */
export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      role="region"
      aria-label="Notifications"
      className={cn(
        'pointer-events-none fixed bottom-24 left-4 right-4 z-[60] flex flex-col gap-2',
        'sm:bottom-6 sm:left-auto sm:right-6 sm:w-96'
      )}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Toast
              variant={toast.variant}
              title={toast.title}
              message={toast.message}
              onDismiss={() => dismiss(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default Toast;
