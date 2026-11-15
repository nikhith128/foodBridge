/**
 * Joins class names, dropping anything falsy.
 *
 *   cn('px-4', isActive && 'bg-primary', undefined)  ->  'px-4 bg-primary'
 *
 * Deliberately tiny: no clsx / tailwind-merge dependency, because Phases.md
 * says no new library without asking, and the components here never need
 * conflicting-class resolution.
 */
export function cn(...values) {
  return values
    .flat(Infinity)
    .filter((value) => typeof value === 'string' && value.trim() !== '')
    .join(' ')
    .trim();
}

export default cn;
