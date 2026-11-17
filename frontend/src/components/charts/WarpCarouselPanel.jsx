import { lazy, Suspense, useEffect, useState } from 'react';

import { cn } from '../../utils/cn.js';

// The WebGL carousel is a separate chunk: it is only requested once the checks
// below say it can actually run.
const WarpCarousel = lazy(() => import('./WarpCarousel.jsx'));

// Four 6x7 green grids (dark #0f4c35 -> mid #16a34a -> mint #a7f3c4), each
// arranged differently so the cards stay distinguishable.
const MESH_1 = [
  '#105a38', '#115f3a', '#11603a', '#105d39', '#105738', '#105437',
  '#12733e', '#137840', '#137940', '#12753f', '#12703e', '#126d3d',
  '#148c44', '#159146', '#159246', '#148e45', '#148944', '#148643',
  '#19a54c', '#21a953', '#23aa55', '#1da750', '#16a24a', '#169f49',
  '#42bc6f', '#4ac076', '#4cc178', '#47be73', '#3eb96c', '#39b667',
  '#6cd292', '#74d799', '#76d89b', '#70d596', '#68d08f', '#62cd8a',
  '#96e9b5', '#9eeebc', '#9fefbe', '#9aecb9', '#91e7b2', '#8ce4ad',
];

const MESH_2 = [
  '#105a38', '#11653b', '#12703e', '#137b40', '#148643', '#159146',
  '#116a3c', '#12753f', '#138041', '#148b44', '#159647', '#16a149',
  '#137940', '#148443', '#148f45', '#159b48', '#1aa54e', '#2daf5d',
  '#148944', '#159446', '#169f49', '#22aa54', '#34b464', '#47be73',
  '#159948', '#18a44b', '#2aae5b', '#3cb86a', '#4fc27a', '#61cc89',
  '#1fa852', '#32b261', '#44bc71', '#57c780', '#69d190', '#7bdb9f',
  '#3ab768', '#4cc178', '#5ecb87', '#71d596', '#83dfa6', '#96e9b5',
];

const MESH_3 = [
  '#9eeebd', '#9aecb9', '#90e7b1', '#8de5ae', '#93e8b3', '#9cedbb',
  '#75d79a', '#70d596', '#67d08e', '#63ce8b', '#69d190', '#72d698',
  '#4bc077', '#46be73', '#3db96b', '#3ab768', '#40ba6d', '#49bf75',
  '#22a954', '#1da750', '#16a24a', '#16a049', '#16a34a', '#1fa852',
  '#159146', '#148e45', '#148944', '#148743', '#148a44', '#148f45',
  '#137840', '#12753f', '#12703e', '#126e3d', '#12713e', '#12773f',
  '#115f3a', '#105c39', '#105738', '#105537', '#105838', '#105e39',
];

const MESH_4 = [
  '#105a38', '#137840', '#159647', '#159647', '#137840', '#105a38',
  '#12733e', '#159146', '#2aae5a', '#2aae5a', '#159146', '#12733e',
  '#148c44', '#21a953', '#53c57d', '#53c57d', '#21a953', '#148c44',
  '#19a54c', '#4bc076', '#7ddca0', '#7ddca0', '#4bc076', '#19a54c',
  '#148c44', '#21a953', '#53c57d', '#53c57d', '#21a953', '#148c44',
  '#12733e', '#159146', '#2aae5a', '#2aae5a', '#159146', '#12733e',
  '#105a38', '#137840', '#159647', '#159647', '#137840', '#105a38',
];

const WARP_STATS = [
  {
    title: 'Meals\nRescued',
    value: '12,500',
    unit: '+',
    footer: 'Saved from landfills',
    mesh: MESH_1,
    numeral: ['#ffffff', '#a7f3c4'],
    accent: '#a7f3c4',
    glow: '#16a34a',
    detail: 'none',
  },
  {
    title: 'Food\nDonors',
    value: '250',
    unit: '+',
    footer: 'Bakeries, groceries, hotels',
    mesh: MESH_2,
    numeral: ['#ffffff', '#a7f3c4'],
    accent: '#86efac',
    glow: '#15803d',
    detail: 'none',
  },
  {
    title: 'Partner\nNGOs',
    value: '80',
    unit: '+',
    footer: 'Shelters & food pantries',
    mesh: MESH_3,
    numeral: ['#ffffff', '#a7f3c4'],
    accent: '#6ee7b7',
    glow: '#22c55e',
    detail: 'none',
  },
  {
    title: 'Donations\nCompleted',
    value: '1,200',
    unit: '+',
    footer: 'Cold chain & ambient',
    mesh: MESH_4,
    numeral: ['#ffffff', '#a7f3c4'],
    accent: '#bbf7d0',
    glow: '#4ade80',
    detail: 'none',
  },
];

const STAGE_BG = '#e9f7eb'; // the existing surface-container-low section token

function supportsWebGL2() {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function canShowCarousel() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  const wide = window.matchMedia('(min-width: 1024px)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return wide && !reduced && supportsWebGL2();
}

/** Desktop + motion allowed + WebGL2, all via matchMedia/feature detection. */
function useCanShowCarousel() {
  // Decide on the first render so a fallback never mounts (or fetches) the chunk.
  const [canShow, setCanShow] = useState(canShowCarousel);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const wide = window.matchMedia('(min-width: 1024px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setCanShow(canShowCarousel());

    wide.addEventListener?.('change', update);
    reduced.addEventListener?.('change', update);
    return () => {
      wide.removeEventListener?.('change', update);
      reduced.removeEventListener?.('change', update);
    };
  }, []);

  return canShow;
}

export default function WarpCarouselPanel({ children }) {
  const canShow = useCanShowCarousel();

  if (!canShow) return <div className="rounded-3xl">{children}</div>;

  return (
    <div className="h-[480px] overflow-hidden rounded-3xl">
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="h-full w-full animate-pulse rounded-3xl bg-surface-container motion-reduce:animate-none"
          />
        }
      >
        <WarpCarousel
          cards={WARP_STATS}
          background={STAGE_BG}
          autoplay
          warp={0.6}
          step={1}
          interval={4}
          ariaLabel="Impact statistics"
          className={cn('focus:ring-2 focus:ring-inset focus:ring-secondary')}
        />
      </Suspense>

      {/* The numerals are painted on a canvas, so expose the same facts as text. */}
      <ul className="sr-only">
        {WARP_STATS.map((stat) => (
          <li key={stat.title}>
            {stat.title.replace('\n', ' ')}: {stat.value}
            {stat.unit} — {stat.footer}
          </li>
        ))}
      </ul>
    </div>
  );
}
