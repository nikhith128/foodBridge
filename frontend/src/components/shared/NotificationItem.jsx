import { cn } from '../../utils/cn.js';

/**
 * NotificationItem
 *
 * One row of the Notifications list (Design.md section 10, page 27): icon tile,
 * title, message, time, an unread dot and an optional actions menu. Clicking the
 * title opens the related page, which is why the title is a real button when
 * `onOpen` is given rather than the whole row.
 *
 * There is no notification dropdown anywhere in the Stitch screens, so this row
 * is derived from Design.md page 27 plus the top-bar bell/dot pattern. Nothing
 * consumes it yet — the Notifications page is on the Phases.md "Later" list — so
 * it is built and tested here, ready for that page.
 */

const TONES = {
  info: 'bg-surface-container-high text-secondary',
  success: 'bg-secondary-container text-on-secondary-container',
  urgent: 'bg-tertiary-fixed text-tertiary',
  error: 'bg-error-container text-on-error-container',
};

export default function NotificationItem({
  icon: Icon,
  title,
  message,
  time,
  unread = false,
  tone = 'info',
  onOpen,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl p-3 transition-colors',
        unread ? 'bg-secondary-container/25' : 'bg-transparent',
        className
      )}
    >
      {Icon && (
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            TONES[tone] || TONES.info
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              'text-left font-label-md text-label-md transition-colors hover:text-secondary',
              'rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
              unread ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
            )}
          >
            {title}
          </button>
        ) : (
          <p
            className={cn(
              'font-label-md text-label-md',
              unread ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
            )}
          >
            {title}
          </p>
        )}

        {message && (
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{message}</p>
        )}

        {time && <p className="mt-1 font-label-sm text-label-sm text-outline">{time}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {unread && (
          <>
            <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
            <span className="sr-only">Unread</span>
          </>
        )}
        {actions}
      </div>
    </div>
  );
}
