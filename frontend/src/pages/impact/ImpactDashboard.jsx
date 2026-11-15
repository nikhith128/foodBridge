import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Award,
  BarChart3,
  Building2,
  CheckCircle2,
  Info,
  Leaf,
  Package,
  RefreshCw,
  Route,
  Sparkles,
  Truck,
  Utensils,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  FilterPills,
  Skeleton,
  STATUS,
  useToast,
} from '../../components/ui/index.js';
import { StatCard } from '../../components/shared/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useTokenColors, { SERIES_TOKENS } from '../../hooks/useTokenColors.js';
import { IMPACT_RANGES, getImpact } from '../../services/impact.service.js';
import { cn } from '../../utils/cn.js';
import { formatDateTime, formatDayKey } from '../../utils/datetime.js';
import { formatQuantityWithWeight } from '../../utils/donationFormat.js';

/**
 * ImpactDashboard — the "Our Impact" board (Step E).
 *
 * There is no Stitch screen for this page (page 29 of Design.md's inventory is
 * MISSING), so it is built from the Design.md section 9 line 112 spec: "Our
 * Impact" with the date filter (7 days, 30 days, All time), five stat cards
 * (Completed Donations, Estimated Meals Rescued, Active Donations, Completed
 * Pickups, Participating Organisations), charts (Meals Over Time, Donations by
 * Status donut, Donations by Category), Top Contributors, a Recent Completed
 * Donations table, and the label "Sample data for demonstration". The volunteer
 * view drops Top Contributors and adds distance travelled plus achievement
 * badges.
 *
 * Every figure comes from GET /api/impact, which derives all of them from
 * COMPLETED donations only and scopes the rows to the caller's role. Nothing on
 * this page is invented: the numbers are the seed's, and the whole board is
 * labelled as sample data because of it.
 *
 * Recharts paints SVG, which needs a real colour rather than a Tailwind class.
 * `useTokenColors` reads the token colours from the stylesheet at runtime so
 * this file still contains no hex value; the charts render only once the colours
 * have resolved, which also keeps them out of the server render.
 */

const MEALS_PER_KG = 2.5;

/** The token each donation status paints with, so the donut is stable. */
const STATUS_TOKEN = {
  AVAILABLE: 'secondary',
  ACCEPTED: 'primaryContainer',
  ASSIGNED: 'surfaceTint',
  PICKED_UP: 'primaryFixedDim',
  COMPLETED: 'primary',
  EXPIRED: 'outlineVariant',
  CANCELLED: 'error',
};

const BADGE_TONE = {
  gold: 'urgent',
  silver: 'tint',
  bronze: 'neutral',
};

/** Thousands-separated, with trailing zeros trimmed. Deterministic, no locale. */
function formatNumber(value, decimals = 0) {
  const n = Number(value) || 0;
  const fixed = n.toFixed(decimals);
  const [whole, frac] = fixed.split('.');
  const trimmed = frac ? frac.replace(/0+$/, '') : '';
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return trimmed ? `${grouped}.${trimmed}` : grouped;
}

/**
 * The five Step E stat cards. Declared as data so the labels, units and footers
 * live in one place, and so the tiles can render their labels while the figures
 * are still loading — the grid never shifts once the numbers arrive.
 */
const STAT_CARDS = [
  {
    label: 'Completed Donations',
    metric: 'completedDonations',
    icon: CheckCircle2,
    unit: 'batches',
    accent: true,
    footer: () => 'Delivered end to end',
  },
  {
    label: 'Estimated Meals Rescued',
    metric: 'mealsRescued',
    icon: Utensils,
    tone: 'secondary',
    valueTone: 'secondary',
    unit: 'meals',
    footer: () => `${MEALS_PER_KG} meals per kg`,
  },
  {
    label: 'Active Donations',
    metric: 'activeDonations',
    icon: Activity,
    unit: 'batches',
    footer: () => 'Open or in transit',
  },
  {
    label: 'Completed Pickups',
    metric: 'completedPickups',
    icon: Truck,
    unit: 'collections',
    footer: (summary) => `${formatNumber(summary.kgRescued, 1)} kg rescued`,
  },
  {
    label: 'Participating Organisations',
    metric: 'participatingOrganisations',
    icon: Building2,
    tone: 'secondary',
    unit: 'partners',
    footer: () => 'Donors and NGOs',
  },
];

/** The colour for a slice, keyed so a status keeps its hue between renders. */
function colourFor(colors, key, index, map = STATUS_TOKEN) {
  const token = map[key] || SERIES_TOKENS[index % SERIES_TOKENS.length];
  return colors?.[token] || colors?.primary;
}

/**
 * A tooltip that uses tokens rather than Recharts' inline default styling.
 * `extra` adds one supporting figure from the same row, e.g. the donation count
 * behind a meal bucket.
 */
function ChartTooltip({ active, payload, label, unit = '', extra }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 shadow-card">
      {label !== undefined && label !== null && (
        <p className="font-label-sm text-label-sm font-semibold text-on-surface">{label}</p>
      )}
      <ul className="mt-1 flex flex-col gap-0.5">
        {payload.map((entry) => (
          <li
            key={entry.dataKey ?? entry.name}
            className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color || entry.payload?.fill }}
              aria-hidden="true"
            />
            <span>{entry.name}</span>
            <span className="font-semibold text-on-surface">
              {formatNumber(entry.value)}
              {unit}
            </span>
          </li>
        ))}
        {extra && row && (
          <li className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <span className="h-2 w-2 shrink-0 rounded-full bg-outline-variant" aria-hidden="true" />
            <span>{extra.label}</span>
            <span className="font-semibold text-on-surface">{formatNumber(row[extra.key])}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

/** The placeholder a chart shows until the token colours resolve. */
function ChartSkeleton({ className = 'h-64' }) {
  return <Skeleton className={cn('w-full', className)} />;
}

function ChartCard({ title, description, colours, children, className }) {
  return (
    <Card padding="lg" className={cn('flex flex-col gap-4', className)}>
      <div>
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{description}</p>
      </div>
      {colours ? children : <ChartSkeleton />}
    </Card>
  );
}

function MealsOverTimeChart({ colours, data }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="impact-meals" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colours.primary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={colours.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={colours.outlineVariant} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDayKey}
            tick={{ fill: colours.onSurfaceVariant, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            width={44}
            tick={{ fill: colours.onSurfaceVariant, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip unit=" meals" extra={{ key: 'donations', label: 'Donations' }} />}
            labelFormatter={formatDayKey}
            cursor={{ stroke: colours.outlineVariant }}
          />
          <Area
            type="monotone"
            dataKey="meals"
            name="Meals"
            stroke={colours.primary}
            strokeWidth={2}
            fill="url(#impact-meals)"
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusDonutChart({ colours, data }) {
  const total = data.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((row, index) => (
                <Cell key={row.status} fill={colourFor(colours, row.status, index)} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-headline-md font-bold text-primary">
            {formatNumber(total)}
          </span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Batches
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {data.map((row, index) => (
          <li key={row.status} className="flex items-center gap-2 font-body-sm text-body-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colourFor(colours, row.status, index) }}
              aria-hidden="true"
            />
            <span className="flex-1 text-on-surface-variant">
              {STATUS[row.status]?.label || row.status}
            </span>
            <span className="font-semibold text-on-surface">{formatNumber(row.count)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryBarChart({ colours, data }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke={colours.outlineVariant} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: colours.onSurfaceVariant, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={132}
            tick={{ fill: colours.onSurfaceVariant, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: colours.surfaceContainerHigh }} />
          <Bar dataKey="count" name="Batches" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {data.map((row, index) => (
              <Cell key={row.category} fill={colourFor(colours, row.category, index, {})} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ImpactDashboard() {
  const { user } = useAuth();
  const { error: raiseError } = useToast();
  const colours = useTokenColors();

  const [range, setRange] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getImpact({ range });
      setData(result);
    } catch (apiError) {
      const message = apiError?.message || 'Could not load your impact figures.';
      setLoadError(message);
      raiseError(message);
    } finally {
      setLoading(false);
    }
  }, [range, raiseError]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary;
  const scope = data?.scope;
  const topContributors = data?.topContributors || [];
  const recentCompleted = data?.recentCompleted || [];
  const volunteer = data?.volunteer || null;

  const statusData = useMemo(
    () =>
      (data?.donationsByStatus || []).map((row) => ({
        ...row,
        label: STATUS[row.status]?.label || row.status,
      })),
    [data]
  );

  const hasAnyData = Boolean(
    summary &&
      (summary.completedDonations > 0 || summary.activeDonations > 0 || statusData.length > 0)
  );

  const emptyCta =
    user?.role === 'DONOR'
      ? { to: '/donor/donations/new', label: 'Create a donation', icon: Package }
      : user?.role === 'NGO'
        ? { to: '/ngo/donations', label: 'Browse available donations', icon: Package }
        : null;

  return (
    <div className="flex flex-col gap-space-lg">
      {/* --- Header ------------------------------------------------------- */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            Impact
          </p>
          <h1 className="mt-1 font-display text-headline-lg-mobile font-bold tracking-tight text-on-surface sm:text-headline-lg">
            Our Impact
          </h1>
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Every rescued meal, completed collection and participating organisation, counted from
            donations that reached people.
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" size="sm" icon={Info}>
              Sample data for demonstration
            </Badge>
            {data?.generatedAt && (
              <span className="font-label-sm text-label-sm text-outline">
                Generated {formatDateTime(data.generatedAt)}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <FilterPills
            items={IMPACT_RANGES}
            value={range}
            onChange={setRange}
            ariaLabel="Impact date range"
          />
          <Button
            type="button"
            variant="outline"
            onClick={load}
            className="shrink-0"
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </header>

      {loadError && (
        <Banner
          variant="error"
          title="We could not load your impact figures"
          action={
            <Button size="sm" variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          }
        >
          {loadError}
        </Banner>
      )}

      {/* --- Empty ------------------------------------------------------- */}
      {!loading && !hasAnyData ? (
        <EmptyState
          icon={Leaf}
          title="No impact recorded yet"
          message="Once a donation is completed end to end — published, accepted, collected and delivered — its meals and collections are counted here."
        >
          {emptyCta && (
            <Button as={Link} to={emptyCta.to} variant="primary">
              <emptyCta.icon className="h-4 w-4" aria-hidden="true" />
              {emptyCta.label}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </EmptyState>
      ) : (
        <>
          {/* --- Stats --------------------------------------------------- */}
          <section
            aria-label="Impact summary"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
          >
            {STAT_CARDS.map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                icon={card.icon}
                tone={card.tone}
                valueTone={card.valueTone}
                accent={card.accent}
                value={loading || !summary ? '—' : formatNumber(summary[card.metric])}
                unit={loading || !summary ? undefined : card.unit}
                footer={
                  loading || !summary ? (
                    <Skeleton className="h-3 w-24" />
                  ) : (
                    <span>{card.footer(summary)}</span>
                  )
                }
              />
            ))}
          </section>

          {/* --- Volunteer extras ---------------------------------------- */}
          {!loading && scope === 'VOLUNTEER' && volunteer && (
            <Card padding="lg" className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container">
                  <Route className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Distance Travelled
                  </p>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-headline-lg font-bold tracking-tight text-primary">
                      {formatNumber(volunteer.distanceKm, 1)}
                    </span>
                    <span className="font-body-md text-body-md font-medium text-on-surface-variant">
                      km
                    </span>
                  </p>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                    A straight-line estimate between each pickup point and the receiving kitchen — the
                    MVP records no route.
                  </p>
                </div>
              </div>

              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Achievement Badges
                </p>
                {volunteer.badges.length === 0 ? (
                  <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
                    No badges yet. Complete a rescue to earn your first.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {volunteer.badges.map((badge) => (
                      <li key={badge.key}>
                        <Badge variant={BADGE_TONE[badge.tier] || 'neutral'} icon={Award}>
                          {badge.label}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}

          {/* --- Charts -------------------------------------------------- */}
          <section aria-label="Impact charts" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              title="Meals Over Time"
              description="Estimated meals from completed rescues, by day."
              colours={colours}
              className="xl:col-span-2"
            >
              {loading ? (
                <ChartSkeleton />
              ) : summary?.completedDonations === 0 ? (
                <p className="flex h-64 items-center justify-center font-body-sm text-body-sm text-on-surface-variant">
                  No completed rescues in this period yet.
                </p>
              ) : (
                <MealsOverTimeChart colours={colours} data={data.mealsOverTime || []} />
              )}
            </ChartCard>

            <ChartCard
              title="Donations by Status"
              description="Every batch in this period, by where it sits in the lifecycle."
              colours={colours}
            >
              {loading ? (
                <ChartSkeleton className="h-80" />
              ) : statusData.length === 0 ? (
                <p className="flex h-80 items-center justify-center font-body-sm text-body-sm text-on-surface-variant">
                  No batches to show yet.
                </p>
              ) : (
                <StatusDonutChart colours={colours} data={statusData} />
              )}
            </ChartCard>

            <ChartCard
              title="Donations by Category"
              description="What kind of food the batches in this period were."
              colours={colours}
            >
              {loading ? (
                <ChartSkeleton />
              ) : (data.donationsByCategory || []).length === 0 ? (
                <p className="flex h-64 items-center justify-center font-body-sm text-body-sm text-on-surface-variant">
                  No batches to show yet.
                </p>
              ) : (
                <CategoryBarChart colours={colours} data={data.donationsByCategory || []} />
              )}
            </ChartCard>
          </section>

          {/* --- Top contributors ---------------------------------------- */}
          {!loading && scope !== 'VOLUNTEER' && (
            <Card padding="none" className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 pt-5 sm:px-5">
                <div>
                  <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    Top Contributors
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Donors ranked by the meals their completed donations provided.
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-high text-secondary">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>

              {topContributors.length === 0 ? (
                <div className="px-4 pb-5 sm:px-5">
                  <EmptyState
                    compact
                    icon={BarChart3}
                    title="No contributors yet"
                    message="A donor appears here once one of their donations has been completed end to end."
                  />
                </div>
              ) : (
                <ol className="border-t border-outline-variant">
                  {topContributors.map((contributor, index) => (
                    <li
                      key={contributor.id}
                      className="flex items-center gap-4 border-b border-outline-variant px-4 py-3.5 last:border-b-0 sm:px-5"
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-label-md text-label-md font-bold',
                          index === 0
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-surface-container-high text-on-surface-variant'
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
                          {contributor.name}
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {formatNumber(contributor.donations)}{' '}
                          {contributor.donations === 1 ? 'donation' : 'donations'} ·{' '}
                          {formatNumber(contributor.kg, 1)} kg
                        </p>
                      </div>
                      <span className="flex shrink-0 items-baseline gap-1.5">
                        <span className="font-display text-headline-sm font-bold text-secondary">
                          {formatNumber(contributor.meals)}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          meals
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          )}

          {/* --- Recent completed ---------------------------------------- */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-4 pb-4 pt-5 sm:px-5">
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Recent Completed Donations
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                The latest batches that reached people, newest first.
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col gap-4 px-4 pb-5 sm:px-5">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : recentCompleted.length === 0 ? (
              <div className="px-4 pb-5 sm:px-5">
                <EmptyState
                  compact
                  icon={Truck}
                  title="Nothing completed yet"
                  message="A donation appears here once its collection and delivery have both been recorded."
                />
              </div>
            ) : (
              <div>
                <div className="hidden border-b border-outline-variant px-5 py-3 sm:grid sm:grid-cols-[2fr_1.5fr_1fr_1fr] sm:gap-4">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Batch
                  </span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Route
                  </span>
                  <span className="text-right font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Meals
                  </span>
                  <span className="text-right font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Completed
                  </span>
                </div>

                <ul>
                  {recentCompleted.map((row) => (
                    <li
                      key={row.id}
                      className="grid grid-cols-1 gap-3 border-b border-outline-variant px-4 py-4 last:border-b-0 sm:grid-cols-[2fr_1.5fr_1fr_1fr] sm:items-center sm:gap-4 sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-title-md text-title-md font-semibold text-on-surface">
                          {row.foodName}
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {formatQuantityWithWeight(row.quantity, row.quantityUnit)} ·{' '}
                          {row.foodCategory}
                        </p>
                      </div>

                      <div className="min-w-0 font-body-sm text-body-sm text-on-surface-variant">
                        <span className="sm:hidden">Route: </span>
                        {row.donor?.name || 'A donor'}
                        <span aria-hidden="true"> → </span>
                        {row.ngo?.organizationName || 'an NGO'}
                      </div>

                      <div className="font-body-sm text-body-sm text-on-surface-variant sm:text-right">
                        <span className="sm:hidden">Meals: </span>
                        <span className="font-semibold text-on-surface">
                          {formatNumber(row.meals)}
                        </span>
                      </div>

                      <div className="font-body-sm text-body-sm text-on-surface-variant sm:text-right">
                        {formatDateTime(row.completedAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </>
      )}

      <p className="flex items-center gap-2 font-label-sm text-label-sm text-outline">
        <Info className="h-4 w-4" aria-hidden="true" />
        Meals are estimated at {MEALS_PER_KG} per kilogram, and only completed donations count.
      </p>
    </div>
  );
}
