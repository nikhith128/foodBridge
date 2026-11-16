import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '../../utils/cn.js';

/**
 * Input
 *
 * Matches the field markup on the Register / Login screens:
 *   w-full h-11 rounded-xl bg-surface-container-lowest shadow-sm
 *   focus:ring-2 focus:ring-secondary/40 focus:bg-surface-bright
 *
 * Deviation from Design.md section 5, which says inputs are 48px: every field
 * on the screens is h-11 (44px). The screens win.
 *
 * A leading icon is optional; the screens put an icon in most fields (pl-10)
 * and none in a few (pl-4), so both paddings are supported.
 */

const Input = forwardRef(function Input(
  {
    label,
    name,
    id,
    type = 'text',
    hint,
    error,
    required = false,
    optional = false,
    leadingIcon: LeadingIcon,
    className,
    containerClassName,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || `input-${name || generatedId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword && revealed ? 'text' : type;
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="font-label-md text-label-md text-on-surface">
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

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={resolvedType}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={cn(hint && hintId, hasError && errorId) || undefined}
          className={cn(
            'w-full h-11 rounded-xl border bg-surface-container-lowest text-on-surface',
            'font-body-md text-body-md shadow-sm placeholder:text-outline',
            'focus:outline-none focus:ring-2 focus:bg-surface-bright transition-colors',
            LeadingIcon ? 'pl-10' : 'pl-4',
            isPassword ? 'pr-11' : 'pr-4',
            hasError
              ? 'border-error ring-2 ring-error/60 focus:ring-error'
              : 'border-outline focus:border-secondary focus:ring-secondary/40',
            props.disabled && 'cursor-not-allowed opacity-60',
            className
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5',
              'text-outline transition-colors hover:bg-surface-container hover:text-on-surface',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40'
            )}
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
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

export default Input;
