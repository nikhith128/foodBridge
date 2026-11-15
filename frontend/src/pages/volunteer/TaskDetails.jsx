import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
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

import {
  Badge,
  Button,
  Card,
  DietBadge,
  EmptyState,
  Input,
  StepTracker,
  useToast,
} from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  badgeStatusFor,
  claimTask,
  completeDelivery,
  taskStatusLabel,
  useVolunteerTasks,
  verifyPickup,
} from '../../data/volunteerTasks.js';
import { countdownLabel, formatDateTime } from '../../utils/datetime.js';
import { estimateMeals } from '../../utils/donationFormat.js';

/**
 * TaskDetails — page 24, a single sample mission and its handoff.
 *
 * The four-digit check happens against the sample record in
 * src/data/volunteerTasks.js because no backend endpoint issues or verifies
 * collection codes. The sample code is shown on the page so the flow can be
 * exercised; a real deployment would send it to the donor, never to the
 * volunteer's screen.
 */

function taskSteps(task) {
  if (task.status === 'AVAILABLE') {
    return [
      { title: 'Task available', status: 'active' },
      { title: 'Claim the pickup', status: 'upcoming' },
      { title: 'Verify donor code', status: 'upcoming' },
      { title: 'Deliver to NGO', status: 'upcoming' },
    ];
  }

  const pickedUp = task.status === 'PICKED_UP' || task.status === 'COMPLETED';
  const completed = task.status === 'COMPLETED';

  return [
    {
      title: 'Task claimed',
      status: 'done',
      meta: task.claimedAt ? formatDateTime(task.claimedAt) : undefined,
    },
    {
      title: 'En route to donor',
      status: pickedUp ? 'done' : 'active',
      meta: `Collect by ${formatDateTime(task.deadline)}`,
    },
    {
      title: 'Donor code verified',
      status: pickedUp ? 'done' : 'upcoming',
      meta: task.pickedUpAt ? formatDateTime(task.pickedUpAt) : 'Ask the donor for the 4-digit code',
    },
    {
      title: 'Delivered to NGO',
      status: completed ? 'done' : pickedUp ? 'active' : 'upcoming',
      meta: task.completedAt
        ? formatDateTime(task.completedAt, { withYear: true })
        : task.ngo.name,
    },
  ];
}

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: raiseError } = useToast();
  const tasks = useVolunteerTasks();

  const [otp, setOtp] = useState('');
  const [codeError, setCodeError] = useState('');

  const task = useMemo(() => tasks.find((entry) => entry.id === id) || null, [tasks, id]);

  if (!task) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-space-lg">
        <Link
          to="/volunteer/tasks"
          className="inline-flex w-fit items-center gap-1 font-label-md text-label-md font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Available Tasks
        </Link>
        <EmptyState
          icon={Truck}
          title="Task not found"
          message={`No sample task matches "${id}". It may have been claimed and completed, or the link may be out of date.`}
        >
          <Button as={Link} to="/volunteer/tasks" variant="primary">
            Browse Available Tasks
          </Button>
        </EmptyState>
      </div>
    );
  }

  const pickedUp = task.status === 'PICKED_UP';
  const completed = task.status === 'COMPLETED';
  const available = task.status === 'AVAILABLE';
  const meals = estimateMeals(task.quantity, task.quantityUnit);

  const handleClaim = () => {
    const claimed = claimTask(task.id);
    if (claimed) {
      success(`"${task.foodName}" is now yours. Head to the donor kitchen and verify the code on arrival.`);
    } else {
      raiseError('That task could not be claimed. It may already belong to another volunteer.');
    }
  };

  const handleVerifyCode = (event) => {
    event.preventDefault();
    setCodeError('');

    if (!/^\d{4}$/.test(otp.trim())) {
      setCodeError('Enter the 4-digit code the donor shows on the donation card.');
      return;
    }

    const result = verifyPickup(task.id, otp);
    if (!result.ok) {
      setCodeError(result.message);
      raiseError(result.message);
      return;
    }

    setOtp('');
    success('Collection code verified. The food is in your custody — deliver it to the NGO.');
  };

  const handleComplete = () => {
    const finished = completeDelivery(task.id);
    if (!finished) {
      raiseError('Confirm the donor code before completing this delivery.');
      return;
    }
    success('Delivery confirmed. The mission is now in your completed history.');
    navigate('/volunteer/my-tasks');
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <div>
        <Link
          to="/volunteer/my-tasks"
          className="mb-2 inline-flex items-center gap-1 font-label-md text-label-md font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to My Tasks
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Mission · Task #{task.reference}
            </p>
            <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
              {task.foodName}
            </h1>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              {task.foodCategory} · {task.quantity} {task.quantityUnit} · ≈ {meals} meals
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-2">
              <DietBadge vegetarian={task.foodType === 'VEG'} />
              <Badge status={badgeStatusFor(task.status)} size="sm" />
              <Badge variant="outline" size="sm" icon={Info}>
                Sample data for demonstration
              </Badge>
            </p>
          </div>

          <div className="sm:text-right">
            <p className="inline-flex items-center gap-1.5 font-label-sm text-label-sm font-semibold text-on-surface-variant">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {countdownLabel(task.deadline)}
            </p>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
              Collection window closes {formatDateTime(task.deadline)}
            </p>
          </div>
        </div>
      </div>

      {/* --- Progress ----------------------------------------------------- */}
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Mission status
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {taskStatusLabel(task.status)}
          </span>
        </div>
        <StepTracker steps={taskSteps(task)} />
      </Card>

      {/* --- Donor and NGO ------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card padding="md" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              1. Pickup origin
            </span>
            <Badge variant="outline" size="sm" icon={ShieldCheck}>
              Donor kitchen
            </Badge>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {task.donor.name}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{task.donor.address}</p>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Ask the donor's kitchen manager for the 4-digit collection code after you inspect the
            packaging.
          </p>
        </Card>

        <Card padding="md" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              2. Delivery destination
            </span>
            <Badge variant="outline" size="sm" icon={ShieldCheck}>
              NGO kitchen
            </Badge>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {task.ngo.name}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{task.ngo.address}</p>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Your coordinator shares the receiving contact when the task is claimed. Deliver directly
            without unapproved stops.
          </p>
        </Card>
      </div>

      {/* --- Route facts -------------------------------------------------- */}
      <Card padding="md" className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <span className="inline-flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <Package className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="font-semibold text-on-surface">
            {task.quantity} {task.quantityUnit}
          </span>{' '}
          of food
        </span>
        <span className="inline-flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <Route className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="font-semibold text-on-surface">{task.distanceKm} km</span> route
        </span>
        <span className="inline-flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <Utensils className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="font-semibold text-on-surface">≈ {meals} meals</span> estimated
        </span>
      </Card>

      {/* --- Action panel ------------------------------------------------- */}

      {available && (
        <Card padding="lg" className="flex flex-col gap-4 border-2 border-primary bg-surface-container-lowest">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-primary">
              <Truck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Claim this pickup
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Claiming adds the route, collection window and sample pickup code to My Tasks. Only
                one volunteer can hold a task at a time.
              </p>
            </div>
          </div>

          <Button type="button" onClick={handleClaim} fullWidth>
            Claim task #{task.reference}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Card>
      )}

      {task.status === 'CLAIMED' && (
        <Card padding="lg" className="flex flex-col gap-5 border-2 border-primary bg-surface-container-lowest">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-primary">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Step 1 · Verify the donor handoff
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Inspect the food and packaging, then enter the 4-digit code shown on the donor's
                donation card. This records the moment the food enters your custody.
              </p>
            </div>
          </div>

          <p className="rounded-xl bg-tertiary-fixed px-4 py-2 font-body-sm text-body-sm text-tertiary">
            Sample collection code for this task:{' '}
            <strong className="font-semibold">{task.otp}</strong>
          </p>

          <form onSubmit={handleVerifyCode} className="flex max-w-sm flex-col gap-3" noValidate>
            <Input
              label="4-digit collection code"
              value={otp}
              onChange={(event) => {
                setOtp(event.target.value.replace(/\D/g, '').slice(0, 4));
                setCodeError('');
              }}
              placeholder="e.g. 4821"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              error={codeError}
              required
            />
            <Button type="submit" fullWidth>
              Confirm physical handoff
            </Button>
          </form>
        </Card>
      )}

      {pickedUp && (
        <Card padding="lg" className="flex flex-col gap-4 border-2 border-secondary bg-surface-container-lowest">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-secondary">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Step 2 · Deliver to the NGO
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                The donor code is verified and the food is in your custody. Hand it to the receiving
                coordinator, then confirm the drop-off.
              </p>
            </div>
          </div>

          <Button type="button" onClick={handleComplete} fullWidth size="lg">
            Confirm drop-off &amp; complete mission
          </Button>
        </Card>
      )}

      {completed && (
        <Card padding="lg" className="flex flex-col gap-4 border-2 border-secondary bg-surface-container-lowest">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-secondary">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Mission complete
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Delivered to {task.ngo.name} on{' '}
                {formatDateTime(task.completedAt, { withYear: true })}. {meals} estimated meals
                rescued over {task.distanceKm} km.
              </p>
            </div>
          </div>

          <Button as={Link} to="/volunteer/my-tasks" variant="outline" className="w-fit">
            Back to My Tasks
          </Button>
        </Card>
      )}

      <p className="font-label-sm text-label-sm text-outline">
        {user?.name ? `${user.name} · ` : ''}Sample mission. The donor code check runs against this
        browser's sample store, not the backend.
      </p>
    </div>
  );
}
