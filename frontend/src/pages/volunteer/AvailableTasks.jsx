import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Info,
  MapPin,
  Package,
  Route,
  Search,
  ShieldCheck,
  Truck,
  Utensils,
} from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  DietBadge,
  EmptyState,
  FilterPills,
  Input,
  Modal,
  ModalNote,
  useToast,
} from '../../components/ui/index.js';
import {
  availableTasks,
  claimTask,
  useVolunteerTasks,
} from '../../data/volunteerTasks.js';
import { cn } from '../../utils/cn.js';
import { countdownLabel, formatDateTime, minutesUntil } from '../../utils/datetime.js';
import {
  estimateMeals,
  formatQuantityWithWeight,
} from '../../utils/donationFormat.js';

/**
 * AvailableTasks — page 22.
 *
 * Every value is sample data: there is no volunteer module on the backend, so
 * no endpoint lists unassigned pickups. Claiming writes to the sample store in
 * src/data/volunteerTasks.js, which is why the record also appears on My Tasks
 * and in the dashboard counters. The claim lasts for this browser session.
 */

const FILTERS = [
  { value: 'all', label: 'All tasks' },
  { value: 'urgent', label: 'Closing soon' },
  { value: 'near', label: 'Under 3 km' },
];

function isUrgent(task) {
  const minutes = minutesUntil(task.deadline);
  return minutes > 0 && minutes <= 120;
}

export default function AvailableTasks() {
  const { success } = useToast();
  const tasks = useVolunteerTasks();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);

  const available = useMemo(() => availableTasks(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return available
      .filter((task) => {
        if (filter === 'urgent' && !isUrgent(task)) return false;
        if (filter === 'near' && task.distanceKm > 3) return false;
        if (!query) return true;
        return [task.foodName, task.donor.name, task.ngo.name, task.foodCategory, task.reference]
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [available, filter, search]);

  const handleClaim = (task) => {
    const claimed = claimTask(task.id);
    setSelectedTask(null);
    if (claimed) {
      success(`"${task.foodName}" claimed. It now appears in My Tasks.`);
    }
  };

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            Volunteer Portal
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            Available Rescue Tasks
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Sample pickups waiting for a field volunteer, soonest collection window first.
          </p>
          <p className="mt-2">
            <Badge variant="outline" size="sm" icon={Info}>
              Sample data for demonstration
            </Badge>
          </p>
        </div>

        <div className="w-full lg:w-80">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by food, donor or task #"
            aria-label="Search available tasks"
            leadingIcon={Search}
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterPills
          items={FILTERS}
          value={filter}
          onChange={setFilter}
          ariaLabel="Filter available tasks"
        />
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">{filteredTasks.length}</span>{' '}
          {filteredTasks.length === 1 ? 'task' : 'tasks'} shown
        </p>
      </div>

      {/* --- Task list ---------------------------------------------------- */}
      {filteredTasks.length === 0 ? (
        available.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Every sample task is claimed"
            message="You have claimed all the sample rescues in this browser session. Reload the page to restore the sample set."
          >
            <Button as={Link} to="/volunteer/my-tasks" variant="primary">
              Go to My Tasks
            </Button>
          </EmptyState>
        ) : (
          <EmptyState
            icon={Search}
            title="No tasks match this filter"
            message="Try a different search term, or clear the filter to see every sample task."
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch('');
                setFilter('all');
              }}
            >
              Clear search and filter
            </Button>
          </EmptyState>
        )
      ) : (
        <div className="flex flex-col gap-4">
          {filteredTasks.map((task) => {
            const urgent = isUrgent(task);
            const meals = estimateMeals(task.quantity, task.quantityUnit);

            return (
              <Card key={task.id} padding="lg" className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {task.foodName}
                      </h2>
                      <DietBadge vegetarian={task.foodType === 'VEG'} />
                      {urgent && (
                        <Badge variant="urgent" size="sm">
                          Closing soon
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                      Task #{task.reference} · {task.foodCategory} ·{' '}
                      <span className="font-semibold text-on-surface">
                        {formatQuantityWithWeight(task.quantity, task.quantityUnit)}
                      </span>{' '}
                      <span className="italic">(≈ {meals} meals)</span>
                    </p>
                  </div>

                  <Badge variant="neutral" size="sm" icon={Route} className="shrink-0">
                    {task.distanceKm} km route
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 rounded-xl bg-surface-container-lowest p-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <p className="flex items-center gap-1 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      Pickup origin
                    </p>
                    <p className="font-body-sm text-body-sm font-semibold text-on-surface">
                      {task.donor.name}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {task.donor.address}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="flex items-center gap-1 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">
                      <Package className="h-4 w-4" aria-hidden="true" />
                      Drop-off NGO
                    </p>
                    <p className="font-body-sm text-body-sm font-semibold text-on-surface">
                      {task.ngo.name}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {task.ngo.address}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-outline-variant pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        urgent ? 'font-semibold text-error' : 'text-on-surface-variant'
                      )}
                    >
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      Collect by {formatDateTime(task.deadline)} · {countdownLabel(task.deadline)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Utensils className="h-4 w-4" aria-hidden="true" />
                      For {task.ngo.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button as={Link} to={`/volunteer/tasks/${task.id}`} variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button type="button" size="sm" onClick={() => setSelectedTask(task)}>
                      Claim Pickup
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="font-label-sm text-label-sm text-outline">
        Claims are stored on this device for the current browser session. The volunteer dispatch API
        is not built yet, so nothing here is written to the backend.
      </p>

      {/* --- Claim confirmation ------------------------------------------- */}
      {selectedTask && (
        <Modal
          open={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title="Confirm task claim"
          subtitle={`Task #${selectedTask.reference}`}
          icon={ShieldCheck}
        >
          <p className="font-body-md text-body-md text-on-surface-variant">
            Commit to collecting{' '}
            <strong className="text-on-surface">{selectedTask.foodName}</strong> from{' '}
            <strong className="text-on-surface">{selectedTask.donor.name}</strong> by{' '}
            <strong className="text-on-surface">{formatDateTime(selectedTask.deadline)}</strong> and
            delivering it to{' '}
            <strong className="text-on-surface">{selectedTask.ngo.name}</strong>.
          </p>

          <ModalNote>
            <span className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
              <span>
                This is a sample claim. On the mission page you will use the demo 4-digit collection
                code to simulate the donor handoff.
              </span>
            </span>
          </ModalNote>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setSelectedTask(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => handleClaim(selectedTask)}>
              Yes, claim task
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
