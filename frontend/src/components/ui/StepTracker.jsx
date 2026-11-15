import { Check, Circle, Loader } from 'lucide-react';

import { cn } from '../../utils/cn.js';

/**
 * StepTracker
 *
 * From the pickup timeline on the Pickup Details screen (4 steps) and the task
 * timeline on Task Details (3 steps):
 *
 *   done      bg-surface-container-low/70, w-10 h-10 rounded-full bg-secondary
 *             circle with a tick, label "Step 1 · Completed" in text-secondary
 *   active    bg-secondary-container/40 with ring-2 ring-secondary, circle in
 *             bg-primary-container, a pulsing icon and a ping dot
 *   upcoming  bg-surface-container-low opacity-80, grey circle
 *
 * Design.md section 12 fixes the order:
 *   AVAILABLE -> ACCEPTED -> ASSIGNED -> PICKED_UP -> COMPLETED
 *
 * Connector lines are omitted: the 4-step version in the screens is a plain
 * grid with no connectors.
 */

const STATUS_STYLES = {
  done: {
    card: 'bg-surface-container-low/70',
    circle: 'bg-secondary text-on-secondary shadow-sm',
    label: 'text-secondary',
    labelText: 'Completed',
  },
  active: {
    card: 'bg-secondary-container/40 ring-2 ring-secondary shadow-sm relative overflow-hidden',
    circle: 'bg-primary-container text-on-primary shadow-sm',
    label: 'text-on-secondary-container',
    labelText: 'Active',
  },
  upcoming: {
    card: 'bg-surface-container-low opacity-80',
    circle: 'bg-surface-container-high text-on-surface-variant',
    label: 'text-outline',
    labelText: 'Upcoming',
  },
};

const COLUMNS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export default function StepTracker({ steps = [], columns = 4, className }) {
  return (
    <ol className={cn('relative grid grid-cols-1 gap-4', COLUMNS[columns], className)}>
      {steps.map((step, index) => {
        const style = STATUS_STYLES[step.status] || STATUS_STYLES.upcoming;
        const Icon = step.icon || (step.status === 'done' ? Check : step.status === 'active' ? Loader : Circle);

        return (
          <li
            key={step.key || step.title || index}
            aria-current={step.status === 'active' ? 'step' : undefined}
            className={cn('flex items-start gap-3 rounded-xl p-3', style.card)}
          >
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                style.circle
              )}
            >
              <Icon
                className={cn('h-5 w-5', step.status === 'active' && 'animate-pulse')}
                aria-hidden="true"
              />
            </div>

            <div className="flex min-w-0 flex-col">
              <span className="flex items-center gap-1">
                <span
                  className={cn(
                    'font-label-sm text-label-sm font-semibold uppercase tracking-wider',
                    style.label
                  )}
                >
                  Step {index + 1} · {step.statusLabel || style.labelText}
                </span>
                {step.status === 'active' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden="true" />
                )}
              </span>

              <span className="truncate font-title-md text-title-md font-bold text-on-surface">
                {step.title}
              </span>

              {step.meta && (
                <span className="truncate font-body-sm text-body-sm text-on-surface-variant">
                  {step.meta}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
