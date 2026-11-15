import { Leaf } from 'lucide-react';

import { cn } from '../../utils/cn.js';

/**
 * Logo
 *
 * PLACEHOLDER MARK. Every Stitch screen shows a hosted bitmap logo (a leaf /
 * bridge glyph) that cannot be reused here: it is an external URL and it is a
 * design reference, not an asset. Until a real logo file is dropped into
 * `frontend/public/`, this renders a Lucide leaf in the brand colour next to the
 * wordmark, which is the same shape the screens use.
 *
 * `tone` picks the ink so the mark works on both the light public header and the
 * dark public footer / sidebar.
 */

const TONES = {
  primary: 'text-primary',
  'on-primary': 'text-on-primary',
  secondary: 'text-secondary',
};

export default function Logo({ tone = 'primary', showWordmark = true, className, wordmarkClassName }) {
  const ink = TONES[tone] || TONES.primary;

  return (
    <span className={cn('flex items-center gap-space-sm', className)}>
      <Leaf className={cn('h-7 w-7 shrink-0', ink)} aria-hidden="true" />
      {showWordmark && (
        <span className={cn('font-display text-title-md font-bold tracking-tight', ink, wordmarkClassName)}>
          FoodBridge AI
        </span>
      )}
    </span>
  );
}
