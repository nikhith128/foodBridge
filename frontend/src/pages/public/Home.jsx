import { ArrowRight, Handshake, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import WarpCarouselPanel from '../../components/charts/WarpCarouselPanel.jsx';
import HeroDonateButton from '../../components/ui/HeroDonateButton.jsx';
import { Badge, Button } from '../../components/ui/index.js';
import {
  DEMO_METRIC,
  HOME_FEATURES,
  HOME_HERO,
  HOME_HERO_LIVE,
  HOME_STATS,
  HOME_STEPS,
} from '../../constants/marketing.js';
import { cn } from '../../utils/cn.js';

/**
 * Home — the public landing page.
 *
 * Rebuilt from the Stitch landing screen
 * (Design/screens/stitch_foodbridge_ai_platform_landing_page/code.html), which
 * is a single-column mobile layout. Five sections, in the screen's order:
 *
 *   1  hero (headline, actions, visual card with floating live rows)
 *   2  impact carousel   — labelled "Demo Feed"; the figures are sample copy
 *   3  how it works      — 01..04
 *   4  why FoodBridge    — four feature cards
 *   5  closing call to action
 *
 * The header and footer come from PublicLayout, so this file owns only the body.
 *
 * Where the mobile screen gives no desktop layout, the sections grow into the
 * grid the content wants (hero 2-up, carousel 4-up, steps 4-up, features 4-up).
 * The visual placeholders in sections 1 and 5 use brand gradients instead of the
 * screen's hosted photographs: those images are design references on an external
 * host, not assets this repo owns (same call as Logo.jsx).
 */

// --- Local pieces -----------------------------------------------------------

/** The section shell: full-bleed background, content aligned to the header. */
function Section({ tone = 'surface', className, children, ...props }) {
  return (
    <section
      className={cn(
        'w-full',
        // Alternate white and pale mint down the page so each section reads as
        // its own block. `low` is the existing pale-mint container token.
        tone === 'low' ? 'bg-surface-container-low' : 'bg-surface-container-lowest',
        className
      )}
      {...props}
    >
      <div className="mx-auto w-full max-w-7xl px-gutter-mobile md:px-margin">{children}</div>
    </section>
  );
}

// --- Sections ---------------------------------------------------------------

function Hero() {
  return (
    <Section className="pt-8 pb-space-xl md:pt-14">
      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2 lg:items-center lg:gap-space-xl">
        <div className="flex flex-col gap-space-lg">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-container-high px-3.5 py-1.5 text-primary shadow-sm">
            <span
              aria-hidden="true"
              className="h-2 w-2 animate-pulse-soft rounded-full bg-secondary motion-reduce:animate-none"
            />
            <span className="font-label-sm text-label-sm uppercase tracking-wider">{HOME_HERO.pill}</span>
          </span>

          <div className="flex flex-col gap-space-lg">
            <h1 className="font-display text-display-mobile font-extrabold tracking-tight text-primary sm:text-headline-lg lg:text-display">
              {HOME_HERO.headline}
              <span className="mt-1 block text-secondary">{HOME_HERO.headlineAccent}</span>
            </h1>
            <p className="max-w-xl font-body-md text-body-md leading-relaxed text-on-surface-variant">
              {HOME_HERO.body}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-space-sm pt-space-xs sm:flex-row">
            <HeroDonateButton />
            <Button
              as={Link}
              to="/register"
              size="lg"
              variant="outline-primary"
              className="rounded-full"
            >
              <Handshake className="h-5 w-5" aria-hidden="true" />
              Join as an NGO
            </Button>
          </div>

          <p className="flex items-start gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
            {HOME_HERO.trust}
          </p>
        </div>

        <div className="relative mt-space-sm w-full overflow-hidden rounded-3xl bg-surface-container-low shadow-card-hover lg:mt-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-secondary-container/50 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-tertiary-fixed/40 blur-2xl"
          />

          <div className="relative h-[300px] w-full overflow-hidden bg-primary sm:h-[360px] lg:h-[420px]">
            <picture className="block h-full w-full">
              <source srcSet="/hero.webp" type="image/webp" />
              <img
                src="/hero.jpg"
                alt="Volunteers handing a crate of fresh food to a community kitchen"
                loading="eager"
                className="h-full w-full object-cover"
              />
            </picture>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,40,20,0.65)_0%,transparent_50%)]"
            />
            <div className="absolute inset-x-4 bottom-3 flex items-center justify-between gap-2 text-on-primary">
              <span className="rounded-full bg-primary/80 px-3 py-1 font-label-sm text-label-sm tracking-wide backdrop-blur-md">
                Harvest Hope Crate No. 408
              </span>
              <span className="flex items-center gap-1 font-label-sm text-label-sm font-semibold">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary-container" />
                Live Dispatch
              </span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-space-sm bg-surface-container-lowest/90 p-space-md backdrop-blur-md">
            {HOME_HERO_LIVE.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.key}
                  className={cn(
                    'flex items-center gap-space-sm rounded-2xl bg-surface-container-low p-space-sm shadow-sm',
                    row.float,
                    'motion-reduce:animate-none'
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-title-md text-body-sm font-semibold text-primary">
                        {row.title}
                      </span>
                      <span className="truncate font-body-sm text-body-sm text-on-surface-variant">
                        {row.meta}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-full bg-surface-container px-2.5 py-1 font-label-sm text-label-sm font-semibold text-on-surface">
                      {row.trailing}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}

function ImpactCarousel() {
  return (
    <Section tone="low" className="py-space-xl" aria-labelledby="impact-heading">
      <div className="mb-space-lg flex flex-col gap-space-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
            Network Transparency
          </span>
          <Badge variant="neutral" size="sm">
            Demo Feed
          </Badge>
        </div>
        <h2
          id="impact-heading"
          className="font-display text-headline-md-mobile font-bold tracking-tight text-primary sm:text-headline-md"
        >
          Small Actions. Meaningful Impact.
        </h2>
        <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Sample figures from the rescue network — illustrative, not live telemetry.
        </p>
      </div>

      <WarpCarouselPanel>
        <div className="flex snap-x snap-mandatory gap-space-md overflow-x-auto pb-space-sm lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
          {HOME_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.key}
                className="flex min-h-[210px] w-[275px] shrink-0 snap-center flex-col justify-between rounded-3xl border border-white/[0.08] bg-primary-container p-space-lg shadow-card-hover lg:w-auto"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.12] text-on-primary backdrop-blur-md">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 font-label-sm text-label-sm font-semibold text-on-primary backdrop-blur-md">
                    {stat.badge}
                  </span>
                </div>
                <div>
                  <div className="font-display text-[2.5rem] font-bold leading-none tracking-tight text-secondary-fixed">
                    {stat.value}
                  </div>
                  <div className="mt-1 font-body-md font-semibold text-on-primary">
                    {stat.label}
                  </div>
                  {/* Two lines are always reserved, so all four numbers sit on
                      the same baseline even when a note fits on one line. */}
                  <div className="mt-0.5 min-h-[2.5rem] font-body-sm text-body-sm text-on-primary/75">
                    {stat.note}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </WarpCarouselPanel>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section className="py-space-xl" aria-labelledby="how-heading">
      <div className="mb-space-lg flex flex-col gap-space-xs">
        <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
          Operational Flow
        </span>
        <h2
          id="how-heading"
          className="font-display text-headline-md-mobile font-bold tracking-tight text-primary sm:text-headline-md"
        >
          From Surplus to Smiles.
        </h2>
        <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Making food donation simple, transparent, and efficient.
        </p>
      </div>

      <div className="relative grid auto-rows-fr grid-cols-1 gap-space-md lg:grid-cols-4 lg:gap-space-lg">
        {/* Desktop only: a thin line runs behind the cards, so the gaps read
            as connectors between steps. Hidden when the cards stack. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-10 z-0 hidden h-px bg-outline-variant lg:block"
        />

        {HOME_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className="relative z-10 flex h-full flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-lg shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-label-sm text-label-sm font-bold text-on-primary shadow-sm">
                  {step.number}
                </span>
                <Icon className="h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
              </div>
              <h3 className="font-title-md text-title-md font-semibold text-primary">{step.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{step.body}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function WhyFoodBridge() {
  return (
    <Section tone="low" className="py-space-xl" aria-labelledby="why-heading">
      <div className="mb-space-lg flex flex-col gap-space-xs">
        <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
          Built for Frictionless Logistics
        </span>
        <h2
          id="why-heading"
          className="font-display text-headline-md-mobile font-bold tracking-tight text-primary sm:text-headline-md"
        >
          Making Every Meal Matter.
        </h2>
        <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Technology and grassroots community working together to make food rescue second nature.
        </p>
      </div>

      <div className="grid auto-rows-fr grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-4">
        {HOME_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.key}
              className="flex h-full flex-col gap-space-sm rounded-3xl bg-surface-container-lowest p-space-lg shadow-card"
            >
              {/* One tile style for every feature: mint wash, brand-green icon. */}
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-primary">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="font-display text-[1rem] font-bold leading-snug text-primary">
                {feature.title}
              </h3>
              <p className="font-body-md text-body-md text-on-surface">{feature.body}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ClosingCta() {
  return (
    <Section className="py-space-xl">
      <div className="relative overflow-hidden rounded-3xl bg-primary-container text-on-primary shadow-overlay">
        {/* On mobile the image is hidden, so the leaf keeps the banner from
            looking empty on the right. On desktop the photo takes over. */}
        <Leaf
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -right-8 h-44 w-44 rotate-12 text-on-primary-container/20 lg:hidden"
          strokeWidth={1}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 h-36 w-36 rounded-full bg-secondary/30 blur-2xl"
        />

        <div className="relative z-10 flex flex-col gap-space-md p-space-lg sm:p-space-xl lg:flex-row lg:items-stretch lg:gap-space-xl">
          <div className="flex flex-1 flex-col gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-label-sm text-label-sm font-semibold text-secondary-fixed backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Get Started Today
              </span>
              <h2 className="mt-1 font-display text-headline-md-mobile font-bold tracking-tight text-on-primary sm:text-headline-md">
                Have Extra Food? Someone Needs It.
              </h2>
              <p className="max-w-2xl font-body-md text-body-md leading-relaxed text-on-primary/90">
                Don&apos;t let good meals go to waste. Join FoodBridge AI and become part of a community
                creating meaningful change every hour.
              </p>
            </div>

            <div className="flex flex-col gap-space-sm pt-space-xs sm:flex-row">
              <Button as={Link} to="/register" size="lg" variant="mint" className="rounded-full">
                Start Donating
                <Handshake className="h-5 w-5" aria-hidden="true" />
              </Button>
              <Button
                as={Link}
                to="/register"
                size="lg"
                variant="outline-light-strong"
                className="rounded-full"
              >
                Join as an NGO
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            <p className="flex items-center gap-2 font-body-sm text-body-sm text-on-primary/85">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              Zero platform fees for non-profit and community partners.
            </p>
          </div>

          <div className="relative hidden w-[40%] shrink-0 overflow-hidden rounded-2xl bg-primary lg:block">
            <picture className="absolute inset-0 block">
              <source srcSet="/hero.webp" type="image/webp" />
              <img
                src="/hero.jpg"
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </picture>
            <div aria-hidden="true" className="absolute inset-0 bg-primary/50" />
          </div>
        </div>
      </div>
    </Section>
  );
}

export default function Home() {
  return (
    <div className="flex w-full flex-col">
      <Hero />
      <ImpactCarousel />
      <HowItWorks />
      <WhyFoodBridge />
      <ClosingCta />
      <p className="sr-only">
        Impact figures shown on this page are sample content, including {DEMO_METRIC.value}{' '}
        {DEMO_METRIC.label.toLowerCase()}.
      </p>
    </div>
  );
}
