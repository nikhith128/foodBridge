import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  Navigation,
  Package,
  Route,
  Truck,
  Utensils,
} from 'lucide-react';

import { Badge, Button, Card, EmptyState, StepTracker } from '../../components/ui/index.js';
import { StatCard } from '../../components/shared/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  activeTasks,
  availableTasks,
  badgeStatusFor,
  completedTotals,
  useVolunteerTasks,
} from '../../data/volunteerTasks.js';
import { countdownLabel, formatDateTime } from '../../utils/datetime.js';

/**
 * VolunteerDashboard — page 21.
 *
 * There is no volunteer API (see src/data/volunteerTasks.js), so the counters,
 * the active mission and the completed totals all come from the labelled sample
 * dispatch store. The greeting is the only live value: it is the signed-in
 * volunteer's own name.
 */

/** The mission to lead with: in transit first, then assigned. */
function leadMission(list) {
  return (
    list.find((task) => task.status === 'PICKED_UP') ||
    list.find((task) => task.status === 'CLAIMED') ||
    null
  );
}

/** The four-step handoff, derived from the sample task's status. */
function missionSteps(mission) {
  const pickedUp = mission.status === 'PICKED_UP';
  const completed = mission.status === 'COMPLETED';

  return [
    {
      title: 'Task assigned',
      status: 'done',
      meta: mission.claimedAt ? formatDateTime(mission.claimedAt) : undefined,
    },
    {
      title: pickedUp || completed ? 'Collected from donor' : 'En route to donor',
      status: pickedUp || completed ? 'done' : 'active',
      meta: pickedUp || completed ? 'Pickup confirmed' : `Due ${formatDateTime(mission.deadline)}`,
    },
    {
      title: 'Delivery code checked',
      status: pickedUp || completed ? 'done' : 'upcoming',
      meta: pickedUp ? 'Verified at handoff' : 'Ask the donor for the 4-digit code',
    },
    {
      title: 'Deliver to NGO',
      status: completed ? 'done' : pickedUp ? 'active' : 'upcoming',
      meta: mission.ngo.name,
    },
  ];
}

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const tasks = useVolunteerTasks();

  const nearby = useMemo(() => availableTasks(tasks), [tasks]);
  const active = useMemo(() => activeTasks(tasks), [tasks]);
  const totals = useMemo(() => completedTotals(tasks), [tasks]);
  const mission = useMemo(() => leadMission(active), [active]);

  const stats = [
    {
      key: 'available',
      label: 'Nearby Tasks',
      icon: Route,
      value: nearby.length,
      unit: nearby.length === 1 ? 'task' : 'tasks',
      tone: 'accent',
      accent: true,
      footer: <span>In the sample dispatch queue</span>,
    },
    {
      key: 'active',
      label: 'Active Missions',
      icon: Truck,
      value: active.length,
      unit: 'in progress',
      tone: 'primary',
      footer: <span>Claimed by you</span>,
    },
    {
      key: 'completed',
      label: 'Meals Delivered',
      icon: CheckCircle2,
      value: totals.meals,
      unit: 'meals',
      tone: 'secondary',
      valueTone: 'secondary',
      footer: <span className="italic">Estimated from completed weight</span>,
    },
    {
      key: 'impact',
      label: 'Distance Travelled',
      icon: Award,
      value: totals.km,
      unit: 'km',
      tone: 'accent',
      footer: <span>Across completed sample missions</span>,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            Volunteer Portal
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            Volunteer Operations
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Welcome back, {user?.name || 'Field Responder'}.
            {active.length > 0
              ? ` You have ${active.length} ${active.length === 1 ? 'mission' : 'missions'} in progress.`
              : ' No mission is in progress right now.'}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline" size="sm" icon={Info}>
              Sample data for demonstration
            </Badge>
            {user?.city && (
              <span className="font-label-sm text-label-sm text-outline">{user.city}</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button as={Link} to="/volunteer/tasks" variant="outline" size="sm">
            View Available Tasks
          </Button>
          <Button as={Link} to="/volunteer/my-tasks" size="sm">
            My Tasks
          </Button>
        </div>
      </header>

      {/* --- Stats -------------------------------------------------------- */}
      <section
        aria-label="Volunteer statistics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ key, ...card }) => (
          <StatCard key={key} {...card} />
        ))}
      </section>

      {/* --- Active mission ----------------------------------------------- */}
      {mission ? (
        <Card padding="lg" className="flex flex-col gap-5 border-l-4 border-l-secondary">
          <div className="flex flex-col gap-3 border-b border-outline-variant pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 inline-flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                <Navigation className="h-4 w-4" aria-hidden="true" />
                <span>Current assigned pickup</span>
              </div>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                {mission.foodName}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Task #{mission.reference} · {mission.foodCategory}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge status={badgeStatusFor(mission.status)} />
              <Badge variant="neutral" size="sm" icon={Clock}>
                {countdownLabel(mission.deadline)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint text-primary">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Origin · Donor kitchen
                  </p>
                  <p className="font-body-md text-body-md font-semibold text-on-surface">
                    {mission.donor.name}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {mission.donor.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-secondary">
                  <Package className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Destination · NGO shelter
                  </p>
                  <p className="font-body-md text-body-md font-semibold text-on-surface">
                    {mission.ngo.name}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {mission.ngo.address}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <Utensils className="h-4 w-4" aria-hidden="true" />
                  {mission.quantity} {mission.quantityUnit}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Route className="h-4 w-4" aria-hidden="true" />
                  {mission.distanceKm} km
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Mission progress
              </h3>
              <StepTracker steps={missionSteps(mission)} />

              <div className="flex flex-wrap items-center gap-3">
                <Button as={Link} to={`/volunteer/tasks/${mission.id}`} size="sm">
                  {mission.status === 'CLAIMED' ? 'Verify pickup code' : 'Continue delivery'}
                </Button>
                <Button as={Link} to="/volunteer/my-tasks" variant="outline" size="sm">
                  Mission overview
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <EmptyState
          compact
          icon={Truck}
          title="No active mission"
          message="Claim a rescue task and its route, collection window and pickup code will appear here."
        >
          <Button as={Link} to="/volunteer/tasks" variant="primary">
            Browse Available Tasks
          </Button>
        </EmptyState>
      )}

      {/* --- Field guidance ----------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card padding="md" className="flex flex-col gap-3">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Pickup protocol checklist
          </h3>
          <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Inspect thermal packaging and seal integrity before sign-off.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Ask the donor for the 4-digit collection code and check it in the task.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Travel directly to the NGO without unapproved stops.
            </li>
          </ul>
        </Card>

        <Card padding="md" className="flex flex-col gap-3">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Need help on the road?
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Your NGO coordinator shares the receiving contact and any route notes when a task is
            claimed. System alerts appear in Notifications.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button as={Link} to="/notifications" variant="outline" size="sm">
              Open Notifications
            </Button>
            <Button as={Link} to="/volunteer/tasks" variant="ghost" size="sm">
              Find another task
            </Button>
          </div>
        </Card>
      </div>

      <p className="font-label-sm text-label-sm text-outline">
        Task records, distances and completion times on this page are sample data. Claims and
        handoffs are kept for this browser session only.
      </p>
    </div>
  );
}
