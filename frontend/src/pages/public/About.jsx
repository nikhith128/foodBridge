import { ArrowRight, Award, Globe, Heart, Leaf, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/ui/index.js';

export default function About() {
  return (
    <div className="flex flex-col gap-16 py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Hero section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-1.5 text-primary font-label-md">
          <Leaf className="h-4 w-4" />
          <span>About FoodBridge AI</span>
        </div>
        <h1 className="font-headline-lg text-4xl sm:text-5xl font-bold tracking-tight text-on-surface">
          Rescuing Surplus Food with <span className="text-primary">Intelligence &amp; Empathy</span>
        </h1>
        <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed">
          FoodBridge AI bridges the gap between commercial food surplus and community hunger through an intelligent, automated matching logistics network.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card padding="lg" className="flex flex-col justify-between gap-6 border-l-4 border-l-primary">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint text-primary">
              <Globe className="h-6 w-6" />
            </div>
            <h2 className="font-display text-headline-sm font-bold text-on-surface">Our Mission</h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              To eradicate avoidable food waste across restaurants, hotels, canteens, and bakeries while providing reliable, high-quality nourishment to food-insecure communities in real time.
            </p>
          </div>
        </Card>

        <Card padding="lg" className="flex flex-col justify-between gap-6 border-l-4 border-l-secondary">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-secondary">
              <Sparkles className="h-6 w-6" />
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
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-headline-md text-3xl font-bold text-on-surface">What Drives Us Forward</h2>
          <p className="font-body-md text-on-surface-variant">Core principles guiding every match, rescue, and community partnership.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="md" className="space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-title-md text-title-md font-semibold text-on-surface">Safety &amp; Compliance</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Strict eligibility checklists, preparation time tracking, and cold-chain adherence ensure every rescued meal is safe and wholesome.
            </p>
          </Card>

          <Card padding="md" className="space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-container text-secondary">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-title-md text-title-md font-semibold text-on-surface">Speed &amp; Efficiency</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Haversine distance calculations and multi-factor scoring match surplus food with the nearest capable NGO in seconds.
            </p>
          </Card>

          <Card padding="md" className="space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-title-md text-title-md font-semibold text-on-surface">Community Trust</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Empowering local shelters, verified donors, and volunteer coordinators with complete transparency and impact tracking.
            </p>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <Card padding="lg" className="bg-primary text-on-primary text-center space-y-6">
        <h2 className="font-headline-md text-3xl font-bold text-on-primary">Ready to Make an Impact?</h2>
        <p className="font-body-lg text-secondary-fixed max-w-xl mx-auto">
          Whether you are a food donor with surplus meals or an NGO serving your community, FoodBridge AI connects you instantly.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button as={Link} to="/register" variant="secondary" size="lg">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button as={Link} to="/login" variant="outline" size="lg" className="border-on-primary text-on-primary hover:bg-on-primary/10">
            Sign In
          </Button>
        </div>
      </Card>
    </div>
  );
}
