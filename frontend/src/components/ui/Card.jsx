import { forwardRef } from 'react';

import { cn } from '../../utils/cn.js';

/**
 * Card
 *
 * The screens use two card shells:
 *   rounded-2xl bg-surface-container-lowest shadow-card   (dashboard panels)
 *   rounded-xl  bg-surface-container-low  border          (nested rows)
 *
 * Default is the 16px `rounded-2xl` from Design.md section 5. Pass
 * `radius="xl"` for the nested 12px variant.
 */

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-6 sm:p-8',
};

const Card = forwardRef(function Card(
  {
    as: Component = 'div',
    padding = 'md',
    radius = '2xl',
    interactive = false,
    className,
    children,
    ...props
  },
  ref
) {
  const isClickable = interactive || typeof props.onClick === 'function';

  return (
    <Component
      ref={ref}
      className={cn(
        'bg-surface-container-lowest shadow-card',
        radius === 'xl' ? 'rounded-xl' : 'rounded-2xl',
        PADDING[padding],
        isClickable &&
          'cursor-pointer transition-all duration-200 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

export default Card;
