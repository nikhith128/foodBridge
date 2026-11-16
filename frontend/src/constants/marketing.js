import {
  Brain,
  Gauge,
  HandHeart,
  HeartHandshake,
  Navigation,
  Network,
  Package,
  ShieldCheck,
  Store,
  TrendingUp,
  Truck,
  Users,
  Utensils,
  Wheat,
} from 'lucide-react';

/**
 * Landing-page copy, lifted from the Stitch landing screen
 * (Design/screens/stitch_foodbridge_ai_platform_landing_page/code.html).
 *
 * The numbers in HOME_STATS are that screen's own demo copy — illustrative
 * marketing figures, not seed data and not live telemetry. The impact carousel
 * is labelled "Demo Feed" on the page for exactly that reason, so no invented
 * statistic is ever presented as real (Phases.md rule 7).
 *
 * Class strings are written out in full rather than composed at runtime, so
 * Tailwind's scanner can see every one of them. This file is inside
 * `content: ['./src/**\/*.{js,jsx}']`, so they are picked up.
 */

// --- Hero ---------------------------------------------------------------

export const HOME_HERO = {
  pill: 'AI-Powered Food Rescue Platform',
  headline: 'Together, We Can End Food Waste.',
  headlineAccent: 'Turning Surplus Food Into Hope.',
  body: 'Every day, nutritious food goes to waste while local communities need it. FoodBridge AI connects commercial food donors with vetted nearby NGOs in real time, routing fresh surplus straight to the table.',
  trust: 'Connecting donors, NGOs, and communities for a better tomorrow.',
};

/**
 * The two floating "live" rows inside the hero visual. The landing screen shows
 * a matched batch and an AI match score; both are sample content.
 */
export const HOME_HERO_LIVE = [
  {
    key: 'batch',
    icon: Wheat,
    title: 'Fresh Sourdough & Veggies',
    meta: 'Just matched with a nearby shelter',
    trailing: '45 kg',
    float: 'animate-float-1',
  },
  {
    key: 'score',
    icon: Brain,
    title: '98% AI Match',
    meta: 'Optimal route compatibility',
    trailing: '1.4 km away',
    float: 'animate-float-2',
  },
];

// --- Impact carousel ----------------------------------------------------

export const HOME_STATS = [
  {
    key: 'meals',
    value: '12,500+',
    label: 'Meals Rescued',
    note: 'Saved from landfills & redistributed',
    badge: '+18% this wk',
    icon: Utensils,
    gradient: 'from-primary via-primary-container to-secondary',
    tone: 'dark',
  },
  {
    key: 'donors',
    value: '250+',
    label: 'Food Donors',
    note: 'Bakeries, groceries, hotel kitchens',
    badge: 'Verified',
    icon: Store,
    gradient: 'from-secondary via-surface-tint to-primary-container',
    tone: 'dark',
  },
  {
    key: 'ngos',
    value: '80+',
    label: 'Partner NGOs',
    note: 'Shelters, soup kitchens & food pantries',
    badge: 'Active Fleet',
    icon: HeartHandshake,
    gradient: 'from-secondary-container via-secondary-fixed to-primary-fixed-dim',
    tone: 'light',
  },
  {
    key: 'completed',
    value: '1,200+',
    label: 'Donations Completed',
    note: 'Cold chain & ambient routed safely',
    badge: '99.2% Success',
    icon: Truck,
    gradient: 'from-primary-container via-surface-variant to-secondary-container',
    tone: 'dark',
  },
];

// --- How it works -------------------------------------------------------

export const HOME_STEPS = [
  {
    key: 'donate',
    number: '01',
    title: 'Donate Food',
    icon: Package,
    body: 'Share your surplus by logging items, quantities, prep timestamps, allergen notices, and collection access windows.',
  },
  {
    key: 'match',
    number: '02',
    title: 'Smart AI Matching',
    icon: Network,
    body: 'The matching engine ranks nearby NGOs by dietary fit, recipient capacity, storage, and travel time.',
  },
  {
    key: 'pickup',
    number: '03',
    title: 'Coordinate Pickup',
    icon: Navigation,
    body: 'The chosen NGO accepts the dispatch and coordinates a verified volunteer collection.',
  },
  {
    key: 'impact',
    number: '04',
    title: 'Create Impact',
    icon: HandHeart,
    body: 'Fresh meals reach communities inside the safe consumption window, diverting food from landfill.',
  },
];

// --- Why FoodBridge -----------------------------------------------------

export const HOME_FEATURES = [
  {
    key: 'matching',
    title: 'Smart NGO Matching',
    icon: Brain,
    body: 'Find suitable NGOs based on food perishability, current intake capacity, refrigeration availability, and route viability.',
  },
  {
    key: 'speed',
    title: 'Faster Food Connections',
    icon: Gauge,
    body: 'Connect surplus donors directly with local dispatchers who can collect and redistribute quickly.',
  },
  {
    key: 'safe',
    title: 'Responsible Food Rescue',
    icon: ShieldCheck,
    body: 'Handling notes, allergen tags, and temperature validation checks keep every donation accounted for.',
  },
  {
    key: 'impact',
    title: 'Measurable Community Impact',
    icon: TrendingUp,
    body: 'Export verified diversion metrics, estimated CO2 avoided, and meal counts for reporting.',
  },
];

// --- Shared demo figures ------------------------------------------------

/**
 * The one figure the Stitch screens repeat across the landing, register and
 * login screens. Kept here so all three say the same thing, and every use site
 * marks it as sample copy.
 */
export const DEMO_METRIC = {
  value: '12,500+',
  label: 'Meals diverted',
};

/** Small proof rows used on the register / login split cards. */
export const AUTH_BENEFITS = {
  REGISTER: [
    { key: 'match', icon: ShieldCheck, text: 'Smart NGO matching with explainable fit scores' },
    { key: 'route', icon: Navigation, text: 'Track surplus from verified pickup to delivery' },
    { key: 'audit', icon: TrendingUp, text: 'Be part of an auditable zero-food-waste network' },
  ],
  LOGIN: [
    {
      key: 'recommend',
      icon: Brain,
      lead: 'Smart NGO recommendations',
      text: 'with transparent affinity scores and payload matching.',
    },
    {
      key: 'telemetry',
      icon: Navigation,
      lead: 'Live donation telemetry',
      text: 'from donor dispatch through to intake logs.',
    },
    {
      key: 'ledger',
      icon: TrendingUp,
      lead: 'Impact ledger',
      text: 'tracking certified diverted meals and estimated carbon avoided.',
    },
  ],
};

/** Icon set re-exported so pages do not import lucide directly for copy. */
export const MARKETING_ICONS = { Users, HeartHandshake, ShieldCheck };
