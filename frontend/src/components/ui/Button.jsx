import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '../../utils/cn.js';

/**
 * Button
 *
 * Variants and sizes are taken from the markup the Stitch screens actually
 * use, so a class list copied out of a screen renders identically here:
 *
 *   primary    bg-primary text-on-primary          (screen: "px-6 py-2.5 rounded-lg bg-primary")
 *   secondary  bg-secondary text-on-secondary      (screen: "h-11 rounded-lg bg-secondary")
 *   container  bg-primary-container                (large CTAs on the dashboards)
 *   mint       bg-mint text-primary                (primary CTA on dark banners)
 *   outline-primary   white + 1.5px primary outline (secondary CTA on light surfaces)
 *   outline-light  transparent + white border      (secondary CTA on dark banners)
 *   outline-light-strong  transparent + 1.5px white border (secondary CTA on dark banners)
 *   outline    transparent + outline-variant border
 *   ghost      transparent, surface-container hover
 *   danger     error tokens, for Cancel / Delete
 *   link       text-only, underlined on hover
 *
 * Radii follow the screen scale: buttons are `rounded-xl` (12px), icon-only
 * buttons are `rounded-full`.
 */

const VARIANTS = {
  primary:
    'bg-primary text-on-primary shadow-sm hover:bg-primary-container focus-visible:ring-primary/40',
  secondary:
    'bg-secondary text-on-secondary shadow-button-soft hover:bg-primary-container focus-visible:ring-secondary/40',
  container:
    'bg-primary-container text-on-primary shadow-sm hover:bg-primary focus-visible:ring-primary-container/40',
  // On dark green banners: a mint fill with dark green ink (10.8:1), and a
  // white-outlined secondary. Both are full tokens, so no override ordering.
  mint: 'bg-mint text-primary shadow-sm hover:bg-primary-fixed-dim focus-visible:ring-mint/60',
  // Secondary CTA on a light surface: white fill, 1.5px brand-green outline.
  'outline-primary':
    'border-[1.5px] border-primary bg-surface-container-lowest text-primary shadow-button-soft hover:bg-surface-container-low focus-visible:ring-primary/40',
  'outline-light':
    'border border-on-primary/70 bg-transparent text-on-primary hover:bg-on-primary/10 focus-visible:ring-on-primary/60',
  // Stronger version for dark banners: 1.5px border that brightens on hover.
  'outline-light-strong':
    'border-[1.5px] border-on-primary/70 bg-transparent text-on-primary hover:border-on-primary hover:bg-on-primary/10 focus-visible:ring-on-primary/60',
  outline:
    'border border-outline-variant bg-transparent text-on-surface hover:bg-surface-container focus-visible:ring-outline/40',
  ghost:
    'bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface focus-visible:ring-outline/40',
  danger:
    'bg-error-container text-on-error-container hover:bg-error hover:text-on-error focus-visible:ring-error/40',
  link: 'bg-transparent text-secondary underline-offset-4 hover:underline focus-visible:ring-secondary/40 px-0',
};

// Heights: sm 36px, md 44px (the screen default), lg 48px (form submits).
const SIZES = {
  sm: 'h-9 px-3 text-label-sm gap-1.5',
  md: 'h-11 px-4 text-label-md gap-2',
  lg: 'h-12 px-6 text-label-md gap-2',
};

const ICON_ONLY = {
  sm: 'h-9 w-9 p-0',
  md: 'h-11 w-11 p-0',
  lg: 'h-12 w-12 p-0',
};

const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    iconOnly = false,
    loading = false,
    disabled = false,
    fullWidth = false,
    className,
    children,
    type,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      // Only <button> gets a default type, so links never receive one.
      type={Component === 'button' ? type || 'button' : type}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-busy={loading || undefined}
      aria-disabled={Component !== 'button' && isDisabled ? true : undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-label-md font-semibold',
        'transition-colors duration-200 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        iconOnly ? ICON_ONLY[size] : SIZES[size],
        VARIANTS[variant],
        fullWidth && 'w-full',
        isDisabled && 'pointer-events-none opacity-50',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          <span className="sr-only">Working…</span>
          {!iconOnly && <span>{children}</span>}
        </>
      ) : (
        children
      )}
    </Component>
  );
});

export default Button;
