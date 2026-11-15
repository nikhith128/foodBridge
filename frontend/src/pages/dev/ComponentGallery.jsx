import { useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Inbox,
  List,
  Lock,
  Mail,
  Map as MapIcon,
  PackageCheck,
  Plus,
  Radar,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  User,
  WifiOff,
} from 'lucide-react';

import {
  Badge,
  Banner,
  BannerAction,
  Button,
  Card,
  DietBadge,
  EmptyState,
  FilterPills,
  Input,
  Modal,
  ModalNote,
  Select,
  Skeleton,
  SkeletonCard,
  SkeletonCircle,
  SkeletonGroup,
  SkeletonText,
  STATUS,
  StepTracker,
  Tabs,
  useToast,
} from '../../components/ui/index.js';
import { DONOR_TYPES } from '../../constants/options.js';

/**
 * ComponentGallery — TEMPORARY development page.
 *
 * Route: /dev/components
 * Purpose: eyeball every UI component at 390 / 768 / 1440 before the real pages
 * use them. Delete this file and its route before Step F.
 */

function Section({ title, note, children }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-headline-sm text-on-surface">{title}</h2>
        {note && <p className="font-body-sm text-body-sm text-on-surface-variant">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function ComponentGallery() {
  const { success, error, info, warning } = useToast();

  const [select, setSelect] = useState('');
  const [tab, setTab] = useState('all');
  const [view, setView] = useState('list');
  const [diet, setDiet] = useState(['veg']);
  const [modal, setModal] = useState(null);
  const [banner, setBanner] = useState(true);

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 sm:px-8">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            Development only
          </span>
          <h1 className="font-display text-headline-md text-primary">FoodBridge AI — UI library</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Steps B2a + B2b. Resize the window to check 390 / 768 / 1440. This page is deleted before
            Step F.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:px-8 sm:py-12">
        {/* ------------------------------------------------------------ Button */}
        <Section
          title="Button"
          note="Primary, secondary and container match the screen markup. Danger is an addition (Design.md needs Cancel / Delete)."
        >
          <Card className="flex flex-col gap-6">
            <Row label="Variants">
              <Button variant="primary">Create Donation</Button>
              <Button variant="secondary">Accept</Button>
              <Button variant="container">View Matches</Button>
              <Button variant="outline">Cancel</Button>
              <Button variant="ghost">Dismiss</Button>
              <Button variant="danger">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
              <Button variant="link">Learn more</Button>
            </Row>

            <Row label="Sizes">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Row>

            <Row label="With icon / icon-only / states">
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add
              </Button>
              <Button variant="ghost" iconOnly aria-label="Search">
                <Search className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="container" iconOnly aria-label="Next">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button loading>Submitting</Button>
              <Button disabled>Disabled</Button>
            </Row>

            <Row label="Full width (mobile forms)">
              <Button fullWidth size="lg" className="sm:max-w-xs">
                Register
              </Button>
            </Row>
          </Card>
        </Section>

        {/* ------------------------------------------------------------- Input */}
        <Section title="Input" note="44px tall, 12px radius, optional leading icon and password reveal.">
          <Card className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              name="gallery-name"
              label="Full Name"
              placeholder="e.g. Sarah Jenkins"
              leadingIcon={User}
              required
            />
            <Input
              name="gallery-email"
              type="email"
              label="Email"
              placeholder="sarah@greenharvest.org"
              leadingIcon={Mail}
              hint="We never share your email."
              required
            />
            <Input
              name="gallery-password"
              type="password"
              label="Password"
              defaultValue="PasscodeRescue2026!"
              leadingIcon={Lock}
              hint="At least 8 characters, with letters and numbers"
            />
            <Input
              name="gallery-error"
              label="Storage capacity"
              defaultValue="not a number"
              leadingIcon={Building2}
              error="Storage capacity must be a number of 0 or more."
            />
            <Input
              name="gallery-optional"
              label="Organization / Business Name"
              placeholder="e.g. Daily Greens Market & Bakery"
              optional
            />
            <Input name="gallery-disabled" label="Account email" defaultValue="donor@foodbridge.test" disabled />
          </Card>
        </Section>

        {/* ------------------------------------------------------------ Select */}
        <Section title="Select" note="Native select, styled to match the Donor Facility Type field.">
          <Card className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Select
              name="gallery-donor-type"
              label="Facility Type"
              leadingIcon={Building2}
              placeholder="Choose a facility type"
              options={DONOR_TYPES}
              value={select}
              onChange={(event) => setSelect(event.target.value)}
              required
            />
            <Select
              name="gallery-category"
              label="Food Category"
              placeholder="Choose a category"
              options={['Cooked Hot Meals', 'Fresh Produce', 'Bakery & Bread']}
              hint="Pick the closest match."
            />
          </Card>
        </Section>

        {/* ------------------------------------------------------------- Badge */}
        <Section
          title="Badge"
          note="Every status from Design.md section 6, drawn only from existing tokens. Icons carry the meaning colour cannot."
        >
          <Card className="flex flex-col gap-6">
            <Row label="Donation lifecycle">
              {['AVAILABLE', 'ACCEPTED', 'ASSIGNED', 'PICKED_UP', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'URGENT'].map(
                (status) => (
                  <Badge key={status} status={status} />
                )
              )}
            </Row>
            <Row label="NGO verification">
              {['VERIFIED', 'PENDING', 'UNVERIFIED'].map((status) => (
                <Badge key={status} status={status} />
              ))}
            </Row>
            <Row label="Diet marker">
              <DietBadge vegetarian />
              <DietBadge vegetarian={false} />
            </Row>
            <Row label="Sizes and custom labels">
              <Badge status="URGENT" size="sm" />
              <Badge variant="outline">Vegetarian Only</Badge>
              <Badge status="AVAILABLE" dot />
              <Badge variant="neutral">Draft</Badge>
            </Row>
            <Row label="All variants">
              {Object.keys(STATUS)
                .map((key) => STATUS[key].variant)
                .filter((value, index, all) => all.indexOf(value) === index)
                .map((variant) => (
                  <Badge key={variant} variant={variant}>
                    {variant}
                  </Badge>
                ))}
            </Row>
          </Card>
        </Section>

        {/* -------------------------------------------------------------- Card */}
        <Section title="Card" note="16px radius by default; pass radius='xl' for nested rows.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card padding="sm">
              <p className="font-label-md text-label-md">padding=&quot;sm&quot;</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">p-3</p>
            </Card>
            <Card>
              <p className="font-label-md text-label-md">padding=&quot;md&quot; (default)</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">p-4 sm:p-5</p>
            </Card>
            <Card padding="lg" interactive>
              <p className="font-label-md text-label-md">interactive</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Hover me — lifts the shadow.
              </p>
            </Card>
            <Card radius="xl" className="md:col-span-3">
              <p className="font-label-md text-label-md">radius=&quot;xl&quot;</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                12px, for rows nested inside another card.
              </p>
            </Card>
          </div>
        </Section>

        {/* ------------------------------------------------------------- Tabs */}
        <Section
          title="Tabs"
          note="Underline tabs (My Donations) and the segmented view switcher (Available Donations), plus the dietary filter pills."
        >
          <Card className="flex flex-col gap-6">
            <Row label="Underline, with counts">
              <div className="w-full">
                <Tabs
                  value={tab}
                  onChange={setTab}
                  items={[
                    { value: 'all', label: 'All Donations', count: 148 },
                    { value: 'active', label: 'Active & In-Transit', count: 3 },
                    { value: 'completed', label: 'Completed', count: 142 },
                    { value: 'expired', label: 'Expired', count: 3 },
                    { value: 'cancelled', label: 'Cancelled', count: 0 },
                  ]}
                />
              </div>
            </Row>

            <Row label="Segmented, icon-only">
              <Tabs
                variant="segmented"
                value={view}
                onChange={setView}
                items={[
                  { value: 'list', icon: List, title: 'List View' },
                  { value: 'map', icon: MapIcon, title: 'Map View' },
                ]}
              />
            </Row>

            <Row label="Segmented, labelled">
              <Tabs
                variant="segmented"
                value={view}
                onChange={setView}
                items={[
                  { value: 'list', label: 'List', icon: List },
                  { value: 'map', label: 'Map', icon: MapIcon },
                ]}
              />
            </Row>

            <Row label="Filter pills (multi-select)">
              <FilterPills
                multiple
                value={diet}
                onChange={setDiet}
                items={[
                  { value: 'veg', label: 'Veg Only' },
                  { value: 'nonveg', label: 'Non-Veg' },
                  { value: 'vegan', label: 'Vegan / Dairy-Free' },
                ]}
              />
            </Row>
          </Card>
        </Section>

        {/* --------------------------------------------------------- Skeleton */}
        <Section
          title="Skeleton"
          note="Loading state from the NGO Dashboard. Always wrap a set in SkeletonGroup so screen readers hear 'Loading'."
        >
          <SkeletonGroup className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SkeletonCard className="md:col-span-2" lines={3} />
              <Card className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <SkeletonCircle />
                  <Skeleton className="h-4 w-32" rounded="full" />
                </div>
                <SkeletonText lines={4} />
                <Skeleton className="h-10 w-full" rounded="xl" />
              </Card>
            </div>
          </SkeletonGroup>
        </Section>

        {/* ------------------------------------------------------- EmptyState */}
        <Section title="EmptyState" note="From the NGO Dashboard empty state. Actions are passed in.">
          <EmptyState
            icon={Radar}
            title="No donations available right now in your radius"
            message="All local surplus batches in your 5 km perimeter have been claimed. We will push instant alerts the moment new commercial kitchens log surplus."
          >
            <Button>
              <Radar className="h-4 w-4" aria-hidden="true" />
              Re-scan Radius (5 km)
            </Button>
            <Button variant="outline">Adjust Food Filters</Button>
          </EmptyState>

          <EmptyState
            compact
            icon={Inbox}
            title="No notifications yet"
            message="Updates about your donations and pickups will appear here."
          />
        </Section>

        {/* ------------------------------------------------------ StepTracker */}
        <Section title="StepTracker" note="The donation lifecycle from Design.md section 12.">
          <Card>
            <StepTracker
              columns={4}
              steps={[
                {
                  key: 'accepted',
                  status: 'done',
                  title: 'Accepted by NGO',
                  meta: 'Hope Foundation · 12:38 PM',
                },
                {
                  key: 'assigned',
                  status: 'active',
                  title: 'En Route to Kitchen',
                  meta: 'Volunteer · ETA 14:15 PM',
                  icon: Truck,
                },
                {
                  key: 'picked',
                  status: 'upcoming',
                  title: 'Picked Up',
                  meta: 'Awaiting collection',
                  icon: PackageCheck,
                },
                {
                  key: 'completed',
                  status: 'upcoming',
                  title: 'Completed',
                  meta: 'Awaiting confirmation',
                  icon: ShieldCheck,
                },
              ]}
            />
          </Card>
        </Section>

        {/* ---------------------------------------------------------- Banner */}
        <Section
          title="Banner"
          note="Design.md section 11 states: Expired, Unavailable, Restricted, Offline. Success is lifted from the screens."
        >
          <div className="flex flex-col gap-3">
            <Banner variant="success" title="Donation published">
              3 nearby NGOs were notified. Matching runs automatically.
            </Banner>
            <Banner variant="info" title="Matching does not certify food safety">
              Please confirm temperature and packaging at collection.
            </Banner>
            <Banner variant="warning" title="Expiring soon">
              This batch must be collected within 38 minutes.
            </Banner>
            <Banner variant="error" title="Another NGO already accepted this">
              The batch has been removed from your list.
            </Banner>
            <Banner variant="expired" title="Safety cutoff expired">
              This donation can no longer be accepted.
            </Banner>
            <Banner variant="offline" title="You are offline">
              Changes will sync when the connection returns.
            </Banner>

            {banner && (
              <Banner
                variant="info"
                title="Dismissible"
                onDismiss={() => setBanner(false)}
                action={<BannerAction onClick={() => setBanner(false)}>Reset</BannerAction>}
              >
                Has an action button and a close button.
              </Banner>
            )}
          </div>
        </Section>

        {/* ----------------------------------------------------------- Modal */}
        <Section
          title="Modal"
          note="The two confirmation dialogs from Donation Details. Escape, backdrop click and Tab are all handled."
        >
          <Card>
            <Row label="Confirmation dialogs">
              <Button onClick={() => setModal('accept')}>Accept Donation…</Button>
              <Button variant="danger" onClick={() => setModal('decline')}>
                Decline Batch…
              </Button>
            </Row>
          </Card>
        </Section>

        {/* ----------------------------------------------------------- Toast */}
        <Section
          title="Toast"
          note="Bottom-anchored on mobile (clears the volunteer bottom nav), bottom-right on desktop. Auto-dismisses after 4s."
        >
          <Card>
            <Row label="Raise a toast">
              <Button variant="secondary" onClick={() => success('Status updated successfully')}>
                Success
              </Button>
              <Button variant="danger" onClick={() => error('Could not publish the donation.')}>
                Error
              </Button>
              <Button variant="outline" onClick={() => warning('This batch expires in 38 minutes.')}>
                Warning
              </Button>
              <Button variant="ghost" onClick={() => info('Matching does not certify food safety.')}>
                Info
              </Button>
              <Button
                variant="container"
                onClick={() =>
                  success('Pickup confirmed.', { title: 'OTP 7842 verified', duration: 0 })
                }
              >
                With title, no auto-dismiss
              </Button>
            </Row>
          </Card>
        </Section>
      </main>

      {/* Accept confirmation — positive tone, checkbox + note panel */}
      <Modal
        open={modal === 'accept'}
        onClose={() => setModal(null)}
        title="Accept Donation Intake?"
        subtitle="Batch #FB-8841 (50 servings)"
        icon={CheckCircle2}
        tone="positive"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModal(null);
                success('Donation accepted.');
              }}
            >
              Confirm Acceptance
            </Button>
          </>
        }
      >
        <ModalNote>
          <p>
            By accepting, <strong>Hope Foundation</strong> commits to collecting this batch before the
            safety deadline.
          </p>
          <span className="font-title-md text-title-md font-semibold text-tertiary-container">
            14:15 PM Today (in 1h 44m)
          </span>
        </ModalNote>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          A volunteer can be assigned from Pickup Management once the batch is accepted.
        </p>
      </Modal>

      {/* Decline confirmation — destructive tone */}
      <Modal
        open={modal === 'decline'}
        onClose={() => setModal(null)}
        title="Decline Batch Intake"
        subtitle="Batch #FB-8841 (Green Leaf Restaurant)"
        icon={Trash2}
        tone="danger"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(null)}>
              Keep Batch
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setModal(null);
                info('Batch returned to the dispatch pool.');
              }}
            >
              Decline
            </Button>
          </>
        }
      >
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Declining releases this surplus back into the routing engine instantly so secondary NGOs
          can be notified.
        </p>
      </Modal>

      {/* Offline banner, pinned to the top like the real app will be */}
      <Banner
        variant="offline"
        sticky
        title="Offline"
        icon={WifiOff}
        className="fixed inset-x-0 top-0 rounded-none"
      >
        Demo of the sticky offline banner.
      </Banner>
    </div>
  );
}
