import { ArrowRight, CheckCircle2, Network, Package, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '../../components/ui/index.js';

/**
 * Match weights shown under step 2, mirroring the scoring split in the copy.
 * 30 + 25 + 25 + 20 = 100.
 */
const MATCH_WEIGHTS = [
  { label: 'Capacity', value: 30 },
  { label: 'Food compatibility', value: 25 },
  { label: 'Distance', value: 25 },
  { label: 'Urgency', value: 20 },
];

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Donor Publishes Surplus Food',
      description: 'Restaurants, hotels, or canteens enter food details, quantity, preparation time, storage conditions, and collection deadline.',
      icon: Package,
    },
    {
      number: 2,
      title: 'AI Matching Engine Scores Recipients',
      description: 'The system filters ineligible NGOs and ranks suitable organisations using capacity (30%), food compatibility (25%), distance (25%), and collection urgency (20%).',
      icon: Network,
    },
    {
      number: 3,
      title: 'NGO Accepts Donation',
      description: 'The top-ranked NGO reviews donation details and accepts the batch securely, so the same donation can never be accepted twice.',
      icon: CheckCircle2,
    },
    {
      number: 4,
      title: 'Pickup & Impact Tracking',
      description: 'The NGO manages pickup progress through ACCEPTED → PICKED_UP → COMPLETED stages, instantly updating community impact metrics and estimated meals rescued.',
      icon: Truck,
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-12 sm:px-8">
      {/* Hero */}
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-1.5 text-primary font-label-md">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>Platform Workflow</span>
        </div>
        <h1 className="text-balance font-headline-lg text-4xl sm:text-5xl font-bold tracking-tight text-on-surface">
          How FoodBridge AI{' '}
          <span className="text-primary">
            Works <span className="whitespace-nowrap">End-to-End</span>
          </span>
        </h1>
        {/* pt-5 adds 20px to the 24px flex gap: 44px between headline and subtitle. */}
        <p className="pt-5 font-body-lg text-lg text-on-surface-variant leading-relaxed">
          Our four-stage food rescue pipeline ensures surplus food travels safely from donor kitchens to community tables with maximum efficiency.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-12">
        {steps.map((step, index) => (
          <div key={step.number} className="relative">
            <Card padding="lg" className="flex h-full flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint text-primary">
                  <step.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container font-label-md text-label-md font-bold text-on-primary"
                >
                  {String(step.number).padStart(2, '0')}
                </span>
              </div>

              <div className="space-y-4">
                <h2 className="font-display text-headline-sm font-bold text-on-surface">{step.title}</h2>

                {step.number === 4 ? (
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    The NGO manages pickup progress through{' '}
                    <span className="inline-flex flex-wrap items-center gap-1.5 align-middle">
                      <Badge status="ACCEPTED" size="sm" />
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-on-surface-variant" aria-hidden="true" />
                      <Badge status="PICKED_UP" size="sm" />
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-on-surface-variant" aria-hidden="true" />
                      <Badge status="COMPLETED" size="sm" />
                    </span>{' '}
                    stages, instantly updating community impact metrics and estimated meals rescued.
                  </p>
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {step.description}
                  </p>
                )}

                {step.number === 2 && (
                  <div className="space-y-2.5 pt-1">
                    {MATCH_WEIGHTS.map(({ label, value }) => (
                      <div key={label}>
                        <div className="mb-1 flex items-baseline justify-between gap-3">
                          <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">
                            {label}
                          </span>
                          <span className="font-body-sm text-body-sm font-bold text-primary">{value}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                          <div
                            className="h-full rounded-full bg-mint ring-1 ring-inset ring-secondary/60"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Desktop-only flow connector between the two cards in a row. */}
            {index % 2 === 0 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 -right-11 hidden -translate-y-1/2 items-center gap-1 md:flex"
              >
                <span className="h-px w-5 bg-primary/25" />
                <ArrowRight className="h-4 w-4 text-primary/40" />
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Safety & Compliance notice */}
      <div className="rounded-2xl border-l-4 border-l-[#f59e0b] bg-[#fffbeb] p-6 shadow-card sm:p-7">
        <h3 className="flex items-center gap-2.5 font-title-md text-title-md font-bold text-on-surface">
          <ShieldCheck className="h-5 w-5 shrink-0 text-[#b45309]" aria-hidden="true" />
          Important Note on Food Safety
        </h3>
        <p className="mt-3 font-body-md text-on-surface-variant leading-relaxed">
          Matching recommendations and eligibility checks assist in coordination, but <strong className="text-on-surface">matching does not certify food safety</strong>. Donors and receiving NGOs maintain final responsibility for inspecting and handling surplus food in compliance with local health regulations.
        </p>
      </div>

      {/* CTA */}
      <div className="space-y-6 rounded-3xl bg-primary-container px-6 py-10 text-center text-on-primary sm:px-12 sm:py-12">
        <h2 className="font-headline-md text-3xl font-bold text-on-primary">Ready to get started?</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Button as={Link} to="/register" variant="mint" size="lg">
            Create an Account <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
          <Button as={Link} to="/login" variant="outline-light" size="lg">
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
