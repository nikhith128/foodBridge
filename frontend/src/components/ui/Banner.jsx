import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Info, WifiOff, X } from 'lucide-react';

import { cn } from '../../utils/cn.js';

/**
 * Banner
 *
 * Design.md section 11 needs four of these — Expired, Unavailable, Restricted
 * and Offline — none of which are in section 4's component list. The markup is
 * the one the Donation Details screen builds dynamically:
 *
 *   p-4 rounded-xl flex items-center justify-between shadow-sm
 *     icon + title (title-md bold) + body (body-sm on-surface-variant)
 *     optional action button: px-3 py-1.5 rounded-lg bg-surface-container-high
 *
 * The success variant (`bg-secondary-container text-on-secondary-container`) is
 * also lifted from that screen; the rest are the same shape on the tokens the
 * screens use for each meaning.
 *
 * `sticky` pins it to the top of the viewport, which is what the Offline
 * requirement needs.
 */

const VARIANTS = {
  info: {
    container: 'bg-surface-container text-on-surface',
    icon: Info,
    iconColour: 'text-secondary',
    action: 'bg-surface-container-high text-on-surface',
  },
  success: {
    container: 'bg-secondary-container text-on-secondary-container',
    icon: CheckCircle2,
    iconColour: 'text-on-secondary-container',
    action: 'bg-surface-container-lowest/60 text-on-secondary-container',
  },
  warning: {
    container: 'bg-tertiary-fixed text-tertiary',
    icon: AlertTriangle,
    iconColour: 'text-tertiary',
    action: 'bg-surface-container-lowest/60 text-tertiary',
  },
  error: {
    container: 'bg-error-container text-on-error-container',
    icon: AlertCircle,
    iconColour: 'text-error',
    action: 'bg-surface-container-lowest/60 text-on-error-container',
  },
  expired: {
    container: 'bg-surface-container-high text-on-surface-variant',
    icon: Clock,
    iconColour: 'text-outline',
    action: 'bg-surface-container-lowest text-on-surface',
  },
  offline: {
    container: 'bg-inverse-surface text-inverse-on-surface',
    icon: WifiOff,
    iconColour: 'text-tertiary-fixed-dim',
    action: 'bg-surface-container-lowest/15 text-inverse-on-surface',
  },
};

export default function Banner({
  variant = 'info',
  title,
  children,
  icon,
  action,
  onDismiss,
  sticky = false,
  className,
}) {
  const preset = VARIANTS[variant] || VARIANTS.info;
  const Icon = icon || preset.icon;

  return (
    <div
      role={variant === 'error' || variant === 'offline' ? 'alert' : 'status'}
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl p-4 shadow-sm',
        preset.container,
        sticky && 'sticky top-0 z-40',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon className={cn('h-6 w-6 shrink-0', preset.iconColour)} aria-hidden="true" />
        <div className="flex min-w-0 flex-col">
          {title && <span className="font-title-md text-title-md font-bold">{title}</span>}
          {children && (
            <span className="font-body-sm text-body-sm opacity-90">{children}</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {action}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className={cn(
              'rounded-lg p-1.5 opacity-70 transition-opacity hover:opacity-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current'
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

/** The reset button the screens pair with a banner. */
export function BannerAction({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-lg px-3 py-1.5 font-label-sm text-label-sm font-semibold transition-opacity hover:opacity-90',
        'bg-surface-container-high text-on-surface',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
