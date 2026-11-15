import { cn } from '../../utils/cn.js';

/**
 * StatCard
 *
 * The metric tile from the NGO dashboard (page 8): a label, an icon tile, a
 * large value with a unit, and a footer line of supporting detail.
 *
 *   label     font-label-sm uppercase tracking-wider, on-surface-variant
 *   icon tile p-2 rounded-xl, tone controls the colour pair
 *   value     font-headline-lg bold, primary (or secondary for a highlight)
 *   footer    the small row of context under the number
 *   accent    the soft blurred blob behind the top-right corner (first card)
 *
 * Kept presentational: the value, unit and footer are passed in, so the same
 * tile works on the donor, NGO and volunteer dashboards.
 */

const ICON_TONES = {
  accent: 'bg-secondary-container text-on-secondary-container',
  primary: 'bg-surface-container-high text-primary',
  secondary: 'bg-surface-container-high text-secondary',
};

export default function StatCard({
  label,
  icon: Icon,
  value,
  unit,
  tone = 'accent',
  valueTone = 'primary',
  footer,
  accent = false,
  className,
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between overflow-hidden rounded-2xl bg-surface-container-lowest p-space-lg shadow-card transition-shadow hover:shadow-card-hover',
        className
      )}
    >
      {accent && (
        <span
          className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-secondary-container/40 blur-xl"
          aria-hidden="true"
        />
      )}

      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        {Icon && (
          <span className={cn('flex items-center justify-center rounded-xl p-2', ICON_TONES[tone])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'font-display text-headline-lg font-bold tracking-tight',
              valueTone === 'secondary' ? 'text-secondary' : 'text-primary'
            )}
          >
            {value}
          </span>
          {unit && (
            <span className="font-body-md text-body-md font-medium text-on-surface-variant">{unit}</span>
          )}
        </div>

        {footer && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
