import { ArrowRight, Globe, Leaf, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/ui/index.js';

export default function About() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-12 sm:px-8">
      {/* Hero section */}
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-1.5 text-primary font-label-md">
          <Leaf className="h-4 w-4" aria-hidden="true" />
          <span>About FoodBridge AI</span>
        </div>
        <h1 className="font-headline-lg text-4xl sm:text-5xl font-bold tracking-tight text-on-surface">
          Rescuing Surplus Food with <span className="text-primary">Intelligence &amp; Empathy</span>
        </h1>
        {/* pt-5 adds 20px to the 24px flex gap: 44px between headline and subtitle. */}
        <p className="pt-5 font-body-lg text-lg text-on-surface-variant leading-relaxed">
          FoodBridge AI bridges the gap between commercial food surplus and community hunger through an intelligent, automated matching logistics network.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card padding="none" className="flex h-full flex-col gap-6 border-l-4 border-l-primary p-8 sm:p-10">
          <div className="space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mint text-primary">
              <Globe className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="font-display text-headline-sm font-bold text-on-surface">Our Mission</h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              To eradicate avoidable food waste across restaurants, hotels, canteens, and bakeries while providing reliable, high-quality nourishment to food-insecure communities in real time.
            </p>
          </div>
        </Card>

        <Card padding="none" className="flex h-full flex-col gap-6 border-l-4 border-l-primary p-8 sm:p-10">
          <div className="space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-container text-secondary">
              <Sparkles className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="font-display text-headline-sm font-bold text-on-surface">Our Vision</h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              A zero-waste society where every surplus meal finds its way to someone in need within minutes of preparation, powered by transparent matching algorithms and dedicated local partners.
            </p>
          </div>
        </Card>
      </div>

      {/* Core Values */}
      <div className="space-y-8">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="font-headline-md text-3xl font-bold text-on-surface">What Drives Us Forward</h2>
          <p className="font-body-md text-on-surface-variant">Core principles guiding every match, rescue, and community partnership.</p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          <Card padding="md" className="flex h-full flex-col gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-title-md text-title-md font-semibold text-on-surface">Safety &amp; Compliance</h3>
            <p className="text-[15px] leading-relaxed text-on-surface-variant">
              Strict eligibility checklists, preparation time tracking, and cold-chain adherence ensure every rescued meal is safe and wholesome.
            </p>
          </Card>

          <Card padding="md" className="flex h-full flex-col gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-container text-secondary">
              <Zap className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-title-md text-title-md font-semibold text-on-surface">Speed &amp; Efficiency</h3>
            <p className="text-[15px] leading-relaxed text-on-surface-variant">
              Haversine distance calculations and multi-factor scoring match surplus food with the nearest capable NGO in seconds.
            </p>
          </Card>

          <Card padding="md" className="flex h-full flex-col gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint text-primary">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-title-md text-title-md font-semibold text-on-surface">Community Trust</h3>
            <p className="text-[15px] leading-relaxed text-on-surface-variant">
              Empowering local shelters, verified donors, and volunteer coordinators with complete transparency and impact tracking.
            </p>
          </Card>
        </div>
      </div>

      {/* Call to Action. A plain div, not Card: Card hard-codes a white
          background, which is what made this banner unreadable. */}
      <div className="space-y-6 rounded-3xl bg-primary-container px-6 py-10 text-center text-on-primary sm:px-12 sm:py-12">
        <h2 className="font-headline-md text-3xl font-bold text-on-primary">Ready to Make an Impact?</h2>
        <p className="mx-auto max-w-xl font-body-lg text-lg leading-relaxed text-on-primary/80">
          Whether you are a food donor with surplus meals or an NGO serving your community, FoodBridge AI connects you instantly.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button as={Link} to="/register" variant="mint" size="lg">
            Get Started <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
          <Button as={Link} to="/login" variant="outline-light" size="lg">
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
