import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  Package,
  Route,
  ShieldCheck,
  Truck,
  Utensils,
} from 'lucide-react';

import { Badge, Button, Card, EmptyState, Tabs } from '../../components/ui/index.js';
import { StatCard } from '../../components/shared/index.js';
import {
  activeTasks,
  badgeStatusFor,
  completedTasks,
  completedTotals,
  useVolunteerTasks,
} from '../../data/volunteerTasks.js';
import { countdownLabel, formatDateTime } from '../../utils/datetime.js';
import { estimateMeals } from '../../utils/donationFormat.js';

/**
 * MyTasks — page 23, the volunteer's active and completed missions.
 *
 * Active and completed records come from the sample dispatch store, so a task
 * claimed on Available Tasks appears here immediately. The two seeded completed
 * rescues are what makes the history and counters non-empty on first visit.
 */

function ActiveMissionCard({ task }) {
  const pickedUp = task.status === 'PICKED_UP';

  return (
    <Card padding="lg" className="flex flex-col gap-4 border-l-4 border-l-primary">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              {task.foodName}
            </h2>
            <Badge status={badgeStatusFor(task.status)} size="sm" />
            {pickedUp && (
              <Badge variant="positive" size="sm" icon={ShieldCheck}>
                Code verified
              </Badge>
            )}
          </div>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Task #{task.reference} · {task.foodCategory} ·{' '}
            {task.quantity} {task.quantityUnit}
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 font-label-sm text-label-sm font-semibold text-on-surface-variant">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {countdownLabel(task.deadline)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl bg-surface-container-lowest p-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            From · Donor kitchen
          </p>
          <p className="font-body-sm text-body-sm font-semibold text-on-surface">{task.donor.name}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{task.donor.address}</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">
            <Package className="h-4 w-4" aria-hidden="true" />
            Deliver to · NGO
          </p>
          <p className="font-body-sm text-body-sm font-semibold text-on-surface">{task.ngo.name}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{task.ngo.address}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-outline-variant pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Collect by {formatDateTime(task.deadline)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Route className="h-4 w-4" aria-hidden="true" />
            {task.distanceKm} km
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Utensils className="h-4 w-4" aria-hidden="true" />
            ≈ {estimateMeals(task.quantity, task.quantityUnit)} meals
          </span>
        </div>

        <Button as={Link} to={`/volunteer/tasks/${task.id}`} size="sm">
          {pickedUp ? 'Continue delivery' : 'Verify pickup code'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
}

function CompletedMissionCard({ task }) {
  return (
    <Card
      padding="md"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mint text-primary">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            {task.foodName}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {task.donor.name} → {task.ngo.name}
          </p>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            {task.quantity} {task.quantityUnit} ·{' '}
            <span className="font-semibold text-on-surface">
              ≈ {estimateMeals(task.quantity, task.quantityUnit)} meals
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <div className="text-left sm:text-right">
          <p className="font-label-sm text-label-sm font-semibold text-on-surface">
            {formatDateTime(task.completedAt, { withYear: true })}
          </p>
          <p className="font-label-sm text-label-sm text-outline">
            {task.distanceKm} km · #{task.reference}
          </p>
        </div>
        <Badge status="COMPLETED" size="sm" />
      </div>
    </Card>
  );
}

export default function MyTasks() {
  const tasks = useVolunteerTasks();
  const [activeTab, setActiveTab] = useState('ACTIVE');

  const active = useMemo(() => activeTasks(tasks), [tasks]);
  const completed = useMemo(() => completedTasks(tasks), [tasks]);
  const totals = useMemo(() => completedTotals(tasks), [tasks]);

  const stats = [
    {
      key: 'active',
      label: 'Active Missions',
      icon: Truck,
      value: active.length,
      unit: 'in progress',
      tone: 'accent',
      accent: true,
      footer: <span>Claimed and not yet delivered</span>,
    },
    {
      key: 'completed',
      label: 'Completed Deliveries',
      icon: CheckCircle2,
      value: completed.length,
      unit: 'deliveries',
      tone: 'primary',
      footer: <span>Signed off with the donor code</span>,
    },
    {
      key: 'meals',
      label: 'Meals Delivered',
      icon: Utensils,
      value: totals.meals,
      unit: 'meals',
      tone: 'secondary',
      valueTone: 'secondary',
      footer: <span className="italic">Estimated from completed weight</span>,
    },
    {
      key: 'distance',
      label: 'Distance Covered',
      icon: Award,
      value: totals.km,
      unit: 'km',
      tone: 'accent',
      footer: <span>Across completed sample missions</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            Volunteer Portal
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            My Tasks
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Track the rescues you have claimed, verify the donor handoff and review completed
            deliveries.
          </p>
          <p className="mt-2">
            <Badge variant="outline" size="sm" icon={Info}>
              Sample data for demonstration
            </Badge>
          </p>
        </div>

        <Button as={Link} to="/volunteer/tasks" variant="outline" className="shrink-0">
          Browse Available Tasks
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>

      {/* --- Summary ------------------------------------------------------ */}
      <section
        aria-label="Mission summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ key, ...card }) => (
          <StatCard key={key} {...card} />
        ))}
      </section>

      {/* --- Tabs --------------------------------------------------------- */}
      <Tabs
        variant="underline"
        items={[
          { value: 'ACTIVE', label: 'Active Missions', count: active.length },
          { value: 'COMPLETED', label: 'Completed Deliveries', count: completed.length },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'ACTIVE' ? (
        active.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No active missions"
            message="You have no pickups in progress. Claim a sample rescue and it will appear here with its route and collection code."
          >
            <Button as={Link} to="/volunteer/tasks" variant="primary">
              Browse Available Tasks
            </Button>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            {active.map((task) => (
              <ActiveMissionCard key={task.id} task={task} />
            ))}
          </div>
        )
      ) : completed.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No completed deliveries yet"
          message="A mission moves here once you verify the donor's 4-digit code and confirm the drop-off at the NGO."
        >
          <Button as={Link} to="/volunteer/tasks" variant="primary">
            Browse Available Tasks
          </Button>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {completed.map((task) => (
            <CompletedMissionCard key={task.id} task={task} />
          ))}
        </div>
      )}

      <p className="font-label-sm text-label-sm text-outline">
        Missions, distances and completion times are sample data. Claims and handoffs are kept for
        this browser session only.
      </p>
    </div>
  );
}
