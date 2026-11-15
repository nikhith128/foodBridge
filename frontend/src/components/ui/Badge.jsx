import { AlertTriangle, CheckCircle2, Clock, Info, ShieldCheck, XCircle } from 'lucide-react';

import { cn } from '../../utils/cn.js';

/**
 * Badge — the single source of status colour (Design.md section 6).
 *
 * COLOUR SOURCE
 * Design.md section 6 asks for blue ACCEPTED, purple ASSIGNED and teal
 * PICKED_UP. The screens never use those hues: they badge everything with the
 * Material tokens already in tailwind.config.js. Per Design.md section 2 the
 * screens win, so every variant below is an existing token and this file
 * introduces no new hex value. The states are told apart by shade plus icon.
 *
 *   positive  bg-secondary-container / on-secondary-container   Available, Verified
 *   deep      bg-primary-container   / on-primary               Accepted
 *   tint      bg-surface-tint        / on-primary               Assigned
 *   secondary bg-secondary           / on-secondary             Picked up
 *   primary   bg-primary             / on-primary               Completed
 *   neutral   bg-surface-container-high / on-surface-variant    Expired, Unverified
 *   urgent    bg-tertiary-fixed      / tertiary                 Urgent, Pending
 *   danger    bg-error-container     / on-error-container       Cancelled
 *   outline   transparent + outline-variant border
 */

const VARIANTS = {
  positive: 'bg-secondary-container text-on-secondary-container',
  deep: 'bg-primary-container text-on-primary',
  tint: 'bg-surface-tint text-on-primary',
  secondary: 'bg-secondary text-on-secondary',
  primary: 'bg-primary text-on-primary',
  neutral: 'bg-surface-container-high text-on-surface-variant',
  urgent: 'bg-tertiary-fixed text-tertiary',
  danger: 'bg-error-container text-on-error-container',
  outline: 'border border-outline-variant text-on-surface-variant',
};

const DOT_COLOURS = {
  positive: 'bg-secondary',
  deep: 'bg-primary-container',
  tint: 'bg-surface-tint',
  secondary: 'bg-secondary',
  primary: 'bg-primary',
  neutral: 'bg-outline',
  urgent: 'bg-tertiary-fixed-dim',
  danger: 'bg-error',
  outline: 'bg-outline-variant',
};

/**
 * Every status the app can show, with its label, colour variant and icon.
 * Icons carry the meaning that colour alone cannot, which is also what makes
 * the green progression accessible to colour-blind users.
 */
export const STATUS = {
  // Donation lifecycle (Design.md section 12)
  AVAILABLE: { label: 'Available', variant: 'positive' },
  ACCEPTED: { label: 'Accepted', variant: 'deep' },
  ASSIGNED: { label: 'Assigned', variant: 'tint' },
  PICKED_UP: { label: 'Picked Up', variant: 'secondary' },
  COMPLETED: { label: 'Completed', variant: 'primary', icon: CheckCircle2 },
  EXPIRED: { label: 'Expired', variant: 'neutral', icon: Clock },
  CANCELLED: { label: 'Cancelled', variant: 'danger', icon: XCircle },
  URGENT: { label: 'Urgent', variant: 'urgent', icon: AlertTriangle },

  // NGO verification (Design.md section 6)
  VERIFIED: { label: 'Verified', variant: 'positive', icon: ShieldCheck },
  PENDING: { label: 'Pending Review', variant: 'urgent', icon: Clock },
  UNVERIFIED: { label: 'Unverified', variant: 'neutral', icon: Info },
};

const SIZES = {
  sm: 'px-2 py-0.5 text-label-sm gap-1',
  md: 'px-3 py-1 text-label-sm gap-1.5',
};

export default function Badge({
  status,
  variant,
  size = 'md',
  dot = false,
  icon: IconProp,
  children,
  className,
  ...props
}) {
  const preset = status ? STATUS[status] : null;

  if (status && !preset) {
    // Loud in development, harmless in production.
    console.warn(`Badge: unknown status "${status}". Add it to STATUS in Badge.jsx.`);
  }

  const resolvedVariant = variant || preset?.variant || 'neutral';
  const Icon = IconProp || preset?.icon;
  const label = children ?? preset?.label ?? status;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-label-sm font-semibold leading-none whitespace-nowrap',
        SIZES[size],
        VARIANTS[resolvedVariant] || VARIANTS.neutral,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_COLOURS[resolvedVariant])}
          aria-hidden="true"
        />
      )}
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {label}
    </span>
  );
}

/**
 * Veg / Non-Veg marker. Design.md section 6: "Veg = green dot, Non-Veg = red
 * dot" — rendered as a dot plus the word, because a bare dot fails colour-blind
 * users.
 */
export function DietBadge({ vegetarian = true, className }) {
  return (
    <Badge
      dot
      size="sm"
      variant={vegetarian ? 'positive' : 'danger'}
      className={className}
    >
      {vegetarian ? 'Veg' : 'Non-Veg'}
    </Badge>
  );
}
