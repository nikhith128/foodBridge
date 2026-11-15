import { Badge, Button } from '../components/ui/index.js';

/**
 * TEMPORARY page (Step A only).
 *
 * Renders the design tokens so we can visually confirm the Tailwind theme is
 * wired up correctly. It is replaced by the real Home page in Step B5.
 */

const swatches = [
  { name: 'primary', class: 'bg-primary', note: 'Headings, primary nav' },
  { name: 'primary-container', class: 'bg-primary-container', note: 'Primary buttons' },
  { name: 'secondary', class: 'bg-secondary', note: 'Confirmations, positive badges' },
  { name: 'secondary-container', class: 'bg-secondary-container', note: 'Pills, tints' },
  { name: 'tertiary-fixed-dim', class: 'bg-tertiary-fixed-dim', note: 'Urgent / expiring' },
  { name: 'surface', class: 'bg-surface border border-outline-variant', note: 'Page canvas' },
  { name: 'surface-container-low', class: 'bg-surface-container-low', note: 'Nested sections' },
  { name: 'surface-container-highest', class: 'bg-surface-container-highest', note: 'Chips, states' },
  { name: 'error', class: 'bg-error', note: 'Errors, cancelled' },
  { name: 'outline-variant', class: 'bg-outline-variant', note: 'Borders' },
];

const statuses = [
  'AVAILABLE',
  'ACCEPTED',
  'ASSIGNED',
  'PICKED_UP',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
  'URGENT',
  'VERIFIED',
  'UNVERIFIED',
];

export default function TokenPreview() {
  return (
    <div className="mx-auto max-w-5xl px-gutter-mobile py-space-xl md:px-gutter">
      <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">
        FoodBridge AI — Step A
      </p>
      <h1 className="mt-space-sm font-display text-headline-lg-mobile text-primary md:text-headline-lg">
        Design tokens loaded
      </h1>
      <p className="mt-space-sm max-w-2xl text-body-md text-on-surface-variant">
        If the greens below look like deep forest pine rather than bright green, the
        Tailwind theme is wired up correctly. This temporary page is replaced by the
        real Home page in Step B.
      </p>

      {/* Colour swatches */}
      <h2 className="mt-space-xl font-display text-headline-sm text-primary">Colour</h2>
      <div className="mt-space-md grid grid-cols-2 gap-space-md md:grid-cols-3 lg:grid-cols-5">
        {swatches.map((s) => (
          <div key={s.name} className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-card">
            <div className={`h-16 w-full ${s.class}`} />
            <div className="p-space-sm">
              <p className="text-label-sm text-on-surface">{s.name}</p>
              <p className="text-body-sm text-on-surface-variant">{s.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status badges — rendered by the real Badge component (B2a) */}
      <h2 className="mt-space-xl font-display text-headline-sm text-primary">Status badges</h2>
      <div className="mt-space-md flex flex-wrap gap-space-sm">
        {statuses.map((status) => (
          <Badge key={status} status={status} />
        ))}
      </div>

      {/* Type scale */}
      <h2 className="mt-space-xl font-display text-headline-sm text-primary">Typography</h2>
      <div className="mt-space-md space-y-space-sm rounded-lg border border-outline-variant bg-surface-container-lowest p-space-lg shadow-card">
        <p className="font-display text-display-mobile text-primary md:text-display">Display / Manrope 800</p>
        <p className="font-display text-headline-md text-primary">Headline / Manrope 600</p>
        <p className="text-body-lg text-on-surface-variant">Body large / Inter 400</p>
        <p className="text-body-md text-on-surface">Body medium / Inter 400</p>
        <p className="text-label-md text-on-surface-variant">Label / Inter 600</p>
      </div>

      {/* Controls */}
      <h2 className="mt-space-xl font-display text-headline-sm text-primary">Controls</h2>
      <div className="mt-space-md flex flex-wrap items-center gap-space-md rounded-lg border border-outline-variant bg-surface-container-lowest p-space-lg shadow-card">
        <Button variant="primary">Primary action</Button>
        <Button variant="secondary">Secondary action</Button>
        <Button variant="ghost">Ghost action</Button>
        <input
          type="text"
          placeholder="Input field (44px)"
          className="h-11 w-64 rounded-xl bg-surface-container-lowest pl-4 pr-4 text-body-md text-on-surface shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
      </div>
    </div>
  );
}
