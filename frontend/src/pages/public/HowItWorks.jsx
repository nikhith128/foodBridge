import { ArrowRight, CheckCircle2, ClipboardList, Network, Package, Sparkles, Truck, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card, StepTracker } from '../../components/ui/index.js';

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
      description: 'The top-ranked NGO reviews donation details and accepts the batch securely through a transactional database lock preventing double acceptance.',
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
    <div className="flex flex-col gap-16 py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-1.5 text-primary font-label-md">
          <Sparkles className="h-4 w-4" />
          <span>Platform Workflow</span>
        </div>
        <h1 className="font-headline-lg text-4xl sm:text-5xl font-bold tracking-tight text-on-surface">
          How FoodBridge AI <span className="text-primary">Works End-to-End</span>
        </h1>
        <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed">
          Our four-stage food rescue pipeline ensures surplus food travels safely from donor kitchens to community tables with maximum efficiency.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((step) => (
          <Card key={step.number} padding="lg" className="flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-4xl font-extrabold text-outline-variant/30 select-none">
              0{step.number}
            </div>
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <h2 className="font-display text-headline-sm font-bold text-on-surface">{step.title}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {step.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Safety & Compliance notice */}
      <Card padding="lg" className="bg-surface-container-low border border-outline-variant space-y-4">
        <h3 className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          Important Note on Food Safety
        </h3>
        <p className="font-body-md text-on-surface-variant leading-relaxed">
          Matching recommendations and eligibility checks assist in coordination, but <strong className="text-on-surface">matching does not certify food safety</strong>. Donors and receiving NGOs maintain final responsibility for inspecting and handling surplus food in compliance with local health regulations.
        </p>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-6">
        <h2 className="font-headline-md text-2xl font-bold text-on-surface">Ready to get started?</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Button as={Link} to="/register" size="lg">
            Create an Account <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button as={Link} to="/login" variant="outline" size="lg">
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
