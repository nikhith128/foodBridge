import { cn } from '../../utils/cn.js';

/**
 * Skeleton
 *
 * From the "Loading Skeleton" state on the NGO Dashboard screen: plain
 * `bg-surface-container` blocks with `rounded-2xl`, pulsing. The Volunteer
 * Dashboard uses the same idea with `bg-surface-variant` bars, which is what
 * SkeletonText emits.
 *
 * Always wrap a set of skeletons in <SkeletonGroup> so screen readers are told
 * the region is loading rather than being read a wall of empty boxes.
 */

export function SkeletonGroup({ children, label = 'Loading', className }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** A single block. Give it a height and width via className. */
export default function Skeleton({ className, rounded = '2xl', ...props }) {
  const radii = {
    sm: 'rounded',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse bg-surface-container', radii[rounded], className)}
      {...props}
    />
  );
}

/** A paragraph placeholder. The last line is short, like real text. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div aria-hidden="true" className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-4 animate-pulse rounded-full bg-surface-variant',
            index === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/** A circular placeholder, for avatars and status dots. */
export function SkeletonCircle({ className }) {
  return <Skeleton rounded="full" className={cn('h-10 w-10', className)} />;
}

/** A card-shaped placeholder. */
export function SkeletonCard({ className, lines = 2 }) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-5 shadow-card', className)}
    >
      <div className="flex items-center gap-3">
        <SkeletonCircle className="h-10 w-10" />
        <Skeleton className="h-4 w-32" rounded="full" />
      </div>
      <SkeletonText lines={lines} />
    </div>
  );
}
