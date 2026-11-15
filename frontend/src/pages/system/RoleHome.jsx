import { Award, BarChart3, HandHeart, Inbox, Package, Route, Truck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge, Banner, Button, Card } from '../../components/ui/index.js';
import StatCard from '../../components/shared/StatCard.jsx';
import { ROLE_LABELS } from '../../constants/navigation.js';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * The dashboard body for all three roles, rendered inside DashboardLayout.
 *
 * Step B4 builds the shell, not the dashboards: the real Donor, NGO and
 * Volunteer dashboards arrive in Steps C-E, and the figures below are
 * placeholders so the layout can be seen working. Every number is labelled as a
 * placeholder, in line with Phases.md rule 7 (no invented statistics).
 */

const PLACEHOLDER_STATS = {
  DONOR: [
    { key: 'active', label: 'Active Donations', icon: Package, value: '3', unit: 'batches', tone: 'accent', accent: true, footer: '+1 since yesterday' },
    { key: 'meals', label: 'Meals Rescued', icon: HandHeart, value: '1,240', unit: 'meals', tone: 'secondary', valueTone: 'secondary' },
    { key: 'pickups', label: 'Pickups Scheduled', icon: Truck, value: '2', unit: 'today', tone: 'primary' },
    { key: 'ngos', label: 'NGOs Matched', icon: Users, value: '5', unit: 'nearby', tone: 'accent' },
  ],
  NGO: [
    { key: 'available', label: 'Available Nearby', icon: Inbox, value: '18', unit: 'batches', tone: 'accent', accent: true, footer: '+4 since 12:00 PM' },
    { key: 'accepted', label: 'Accepted Donations', icon: Truck, value: '2', unit: 'active', tone: 'primary' },
    { key: 'completed', label: 'Completed Collections', icon: HandHeart, value: '342', unit: 'batches', tone: 'secondary', valueTone: 'secondary' },
    { key: 'capacity', label: 'Capacity Used', icon: BarChart3, value: '64', unit: '%', tone: 'accent' },
  ],
  VOLUNTEER: [
    { key: 'tasks', label: 'Available Tasks', icon: Route, value: '7', unit: 'near you', tone: 'accent', accent: true },
    { key: 'active', label: 'Active Task', icon: Truck, value: '1', unit: 'in progress', tone: 'primary' },
    { key: 'completed', label: 'Completed Pickups', icon: HandHeart, value: '28', unit: 'this month', tone: 'secondary', valueTone: 'secondary' },
    { key: 'badges', label: 'Achievement Badges', icon: Award, value: '4', unit: 'earned', tone: 'accent' },
  ],
};

export default function RoleHome() {
  const { user } = useAuth();
  const role = user?.role;
  const roleLabel = ROLE_LABELS[role] || 'Account';
  const stats = PLACEHOLDER_STATS[role] || [];

  return (
    <div className="flex w-full flex-col gap-space-lg">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-headline-md text-primary">{roleLabel} dashboard</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Welcome back, {user?.name}.
          </p>
        </div>
        <Badge variant="positive" size="md">
          {roleLabel}
        </Badge>
      </header>

      <Banner variant="info" title="Layout preview">
        This is the Step B4 shell. The real dashboard content is built in Steps C-E, so the figures
        below are placeholders.
      </Banner>

      <section aria-label="Placeholder metrics" className="flex flex-col gap-3">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
          Placeholder figures — not real data
        </span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ key, ...card }) => (
            <StatCard key={key} {...card} />
          ))}
        </div>
      </section>

      <Card className="flex flex-col gap-3">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
          What is built so far
        </span>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          The sidebar, top bar and mobile drawer are real; the navigation items marked{' '}
          <span className="font-semibold text-on-surface">Soon</span> are not built yet. Steps C-E
          fill them in.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button as={Link} to="/" variant="outline" size="sm">
            Public home
          </Button>
        </div>
      </Card>
    </div>
  );
}
