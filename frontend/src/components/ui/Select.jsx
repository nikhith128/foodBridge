import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '../../utils/cn.js';

/**
 * Select
 *
 * Same shell as Input, plus `appearance-none` and a chevron, matching the
 * "Donor Facility Type" field on the Register screen:
 *   h-11 pl-10 pr-8 rounded-xl bg-surface-container-lowest appearance-none
 *
 * Children are plain <option> elements — the screens use native selects, so
 * there is no custom listbox to keep in sync with the keyboard.
 */

const Select = forwardRef(function Select(
  {
    label,
    name,
    id,
    hint,
    error,
    required = false,
    optional = false,
    leadingIcon: LeadingIcon,
    placeholder,
    options = [],
    className,
    containerClassName,
    children,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const selectId = id || `select-${name || generatedId}`;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="font-label-md text-label-md text-on-surface">
          {label}
          {required ? (
            <span className="text-error" aria-hidden="true">
              {' '}
              *
            </span>
          ) : (
            optional && <span className="font-normal text-outline"> (Optional)</span>
          )}
        </label>
      )}

      <div className="relative">
        {LeadingIcon && (
          <LeadingIcon
            className={cn(
              'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
              hasError ? 'text-error' : 'text-outline'
            )}
            aria-hidden="true"
          />
        )}

        <select
          ref={ref}
          id={selectId}
          name={name}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={cn(hint && hintId, hasError && errorId) || undefined}
          className={cn(
            'w-full h-11 rounded-xl bg-surface-container-lowest text-on-surface',
            'font-body-md text-body-md shadow-sm appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:bg-surface-bright transition-colors',
            LeadingIcon ? 'pl-10' : 'pl-4',
            'pr-10',
            hasError ? 'ring-2 ring-error/60 focus:ring-error' : 'focus:ring-secondary/40',
            props.disabled && 'cursor-not-allowed opacity-60',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const text = typeof option === 'string' ? option : option.label;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
          {children}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
          aria-hidden="true"
        />
      </div>

      {hasError ? (
        <p id={errorId} role="alert" className="font-label-sm text-label-sm text-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="font-label-sm text-label-sm text-outline">
            {hint}
          </p>
        )
      )}
    </div>
  );
});

export default Select;
