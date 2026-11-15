import { Skeleton, SkeletonGroup } from '../ui/index.js';

/**
 * Shown while AuthContext is still resolving the stored session, and while a
 * role is being checked. Design.md section 11 requires a Loading state that
 * uses the shared Skeleton components rather than a bespoke spinner.
 *
 * The label is announced to screen readers by SkeletonGroup.
 */
export default function RouteLoader({ label = 'Loading your account' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <SkeletonGroup label={label} className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4">
          <Skeleton rounded="full" className="h-12 w-12" />
          <Skeleton rounded="full" className="h-4 w-40" />
          <Skeleton rounded="full" className="h-4 w-28" />
        </div>
      </SkeletonGroup>
    </div>
  );
}
