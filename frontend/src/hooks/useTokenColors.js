import { useEffect, useState } from 'react';

/**
 * useTokenColors
 *
 * Recharts paints SVG, and SVG `fill`/`stroke` need a real colour — a Tailwind
 * class cannot be used. The obvious shortcut is to hard-code the token hex values
 * in the chart, but Design.md section 5 forbids raw hex in components, and the UI
 * smoke test enforces it by scanning the rendered markup.
 *
 * So the colours are read from the Tailwind tokens at runtime instead: one hidden
 * probe element per token, each carrying the matching `text-*` class, and
 * `getComputedStyle` resolves it to the browser's own `rgb(...)` string. Nothing
 * is hard-coded, and if a token is ever re-tuned the charts follow it.
 *
 * Returns `null` until the first effect runs. Charts must render only once it is
 * non-null, which also keeps them out of the server render — Recharts has no
 * layout to measure there.
 */

/** Token key -> the utility class whose `color` resolves to that token. */
const TOKEN_CLASSES = {
  primary: 'text-primary',
  primaryContainer: 'text-primary-container',
  primaryFixedDim: 'text-primary-fixed-dim',
  secondary: 'text-secondary',
  secondaryContainer: 'text-secondary-container',
  tertiary: 'text-tertiary',
  tertiaryContainer: 'text-tertiary-container',
  tertiaryFixedDim: 'text-tertiary-fixed-dim',
  surfaceTint: 'text-surface-tint',
  error: 'text-error',
  outline: 'text-outline',
  outlineVariant: 'text-outline-variant',
  onSurfaceVariant: 'text-on-surface-variant',
  surfaceContainerHigh: 'text-surface-container-high',
};

/** The order series take their colour in: strongest brand ink first. */
export const SERIES_TOKENS = [
  'primary',
  'secondary',
  'primaryContainer',
  'tertiaryFixedDim',
  'surfaceTint',
  'primaryFixedDim',
  'secondaryContainer',
  'tertiary',
];

export default function useTokenColors() {
  const [colors, setColors] = useState(null);

  useEffect(() => {
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';

    const entries = Object.entries(TOKEN_CLASSES);
    const probes = entries.map(([, className]) => {
      const probe = document.createElement('span');
      probe.className = className;
      probe.textContent = '\u00b7';
      host.appendChild(probe);
      return probe;
    });

    document.body.appendChild(host);
    const resolved = {};
    entries.forEach(([key], index) => {
      resolved[key] = getComputedStyle(probes[index]).color;
    });
    document.body.removeChild(host);

    setColors(resolved);
  }, []);

  return colors;
}
