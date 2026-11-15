import { cn } from '../../utils/cn.js';

/**
 * EmptyState
 *
 * From the "Empty State" on the NGO Dashboard screen:
 *   py-20 px-4 bg-surface-container-lowest rounded-3xl text-center shadow-sm
 *   w-20 h-20 rounded-full bg-surface-container-high icon circle
 *   headline-md title in primary
 *   body-md message in on-surface-variant, capped at max-w-md
 *   an action row (primary + optional secondary button)
 *
 * Design.md section 11 asks for "Empty (message plus button)" on every relevant
 * page, so the buttons are passed in as children rather than hard-coded — an
 * empty state on Available Donations needs "Re-scan Radius", while an empty
 * Impact Dashboard needs something else.
 */

export default function EmptyState({
  icon: Icon,
  title,
  message,
  children,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl bg-surface-container-lowest px-4 text-center shadow-card',
        compact ? 'py-12' : 'py-20',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-high text-secondary">
          <Icon className="h-11 w-11" aria-hidden="true" />
        </div>
      )}

      <h2 className="font-display text-headline-md text-primary">{title}</h2>

      {message && (
        <p className="mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">{message}</p>
      )}

      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}
