import { lazy, Suspense, useEffect, useState } from 'react';

import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from './index.js';

// The shader library is loaded only after the desktop checks below pass.
const LiquidMetalButton = lazy(() => import('./LiquidMetalButton.jsx'));

// Matches the existing hero "Donate Food" Button (size="lg": h-12 px-6).
const BUTTON_WIDTH = 160;
const BUTTON_HEIGHT = 48;

// translateZ(25px) under perspective(1000px) scales the metal ~1.0256x, so
// feed slightly smaller internal dimensions to land on the exact footprint.
const METAL_WIDTH = 156;
const METAL_HEIGHT = 46.8;

function hasWebGL2() {
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

function canShowMetalButton() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return (
    window.matchMedia('(min-width: 1024px)').matches &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    hasWebGL2()
  );
}

/**
 * Hero "Donate Food" CTA: the liquid-metal button on capable desktop
 * browsers, the original green Button everywhere else.
 */
export default function HeroDonateButton() {
  // Decide on the first render so a fallback never mounts (or fetches) the chunk.
  const [canShow, setCanShow] = useState(canShowMetalButton);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const queries = [
      window.matchMedia('(min-width: 1024px)'),
      window.matchMedia('(pointer: fine)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
    ];
    const update = () => setCanShow(canShowMetalButton());
    queries.forEach((query) => query.addEventListener?.('change', update));
    return () => {
      queries.forEach((query) => query.removeEventListener?.('change', update));
    };
  }, []);

  const originalButton = (
    <Button
      as={Link}
      to="/register"
      size="lg"
      variant="primary"
      className="rounded-full"
    >
      Donate Food
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </Button>
  );

  if (!canShow) return originalButton;

  return (
    <div
      className="inline-flex shrink-0 items-center justify-center align-middle"
      style={{ width: BUTTON_WIDTH, height: BUTTON_HEIGHT }}
    >
      {/* The original button holds the exact footprint until the chunk loads. */}
      <Suspense fallback={originalButton}>
        <LiquidMetalButton
          label="Donate Food"
          width={METAL_WIDTH}
          height={METAL_HEIGHT}
          onClick={() => navigate('/register')}
          icon={
            <ArrowRight
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
              style={{
                color: '#a7f3c4',
                filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.5))',
              }}
            />
          }
        />
      </Suspense>
    </div>
  );
}
