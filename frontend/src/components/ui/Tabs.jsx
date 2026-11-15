import { cn } from '../../utils/cn.js';

/**
 * Tabs
 *
 * Two shapes, both taken from the screens:
 *
 *   underline  "All Donations / Active & In-Transit / ..." on My Donations.
 *              Active tab is text-primary with a 2px secondary underline;
 *              inactive is text-on-surface-variant. An optional count pill sits
 *              to the right of the label.
 *
 *   segmented  the view switcher (list / map) and the segmented filters.
 *              A surface-container-low track with p-1; the active segment is
 *              surface-container-lowest with a shadow.
 *
 * Controlled component: pass `value` and `onChange`.
 */

export default function Tabs({
  items = [],
  value,
  onChange,
  variant = 'underline',
  className,
  ariaLabel = 'Tabs',
}) {
  if (variant === 'segmented') {
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          'flex items-center gap-1 overflow-x-auto rounded-xl bg-surface-container-low p-1',
          className
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const selected = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange?.(item.value)}
              title={item.title || item.label}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
                item.label ? 'px-3 py-1.5' : 'p-2',
                'font-label-sm text-label-sm font-semibold',
                selected
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              )}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />}
              {item.label && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // underline
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex items-center gap-4 overflow-x-auto border-b border-outline-variant', className)}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange?.(item.value)}
            className={cn(
              'relative flex items-center gap-2 whitespace-nowrap pb-2.5 font-label-md text-label-md font-semibold',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
              selected ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
            <span>{item.label}</span>
            {item.count !== undefined && item.count !== null && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 font-label-sm text-label-sm font-bold',
                  selected
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-surface-container text-on-surface'
                )}
              >
                {item.count}
              </span>
            )}
            {selected && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-secondary"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Filter pills — the dietary filter row on Available Donations. Kept here
 * because it is the same idea (a single-select control) in a pill shape.
 */
export function FilterPills({ items = [], value, onChange, multiple = false, className, ariaLabel = 'Filters' }) {
  const isSelected = (itemValue) =>
    multiple ? Array.isArray(value) && value.includes(itemValue) : value === itemValue;

  const toggle = (itemValue) => {
    if (!multiple) {
      onChange?.(itemValue);
      return;
    }
    const current = Array.isArray(value) ? value : [];
    onChange?.(
      current.includes(itemValue)
        ? current.filter((entry) => entry !== itemValue)
        : [...current, itemValue]
    );
  };

  return (
    <div role="group" aria-label={ariaLabel} className={cn('flex flex-wrap items-center gap-2', className)}>
      {items.map((item) => {
        const selected = isSelected(item.value);
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(item.value)}
            className={cn(
              'flex items-center gap-1 rounded-full px-3 py-1.5 font-label-sm text-label-sm font-semibold',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
              selected
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            )}
          >
            <span>{item.label}</span>
            {selected && <span aria-hidden="true">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
