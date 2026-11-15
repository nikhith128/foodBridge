/**
 * Impact controller — the numbers behind the Impact Dashboard (Step E).
 *
 * GET /api/impact   role-aware aggregates, computed from COMPLETED donations.
 *
 * Phases.md Step E is one sentence: "calculated from COMPLETED donations only".
 * Everything a rescue achieves — meals, kilograms, completed pickups, the
 * contributors, the recent table — is therefore derived from donations whose
 * status is COMPLETED. Donations that are still open only feed the "Active
 * Donations" counter and the status donut, and they never contribute a meal.
 *
 * Scope, by role (the same rule the rest of the API uses):
 *   DONOR      donations this donor published
 *   NGO        donations it received (the pickup names it)
 *   VOLUNTEER  donations it collected (the pickup names it)
 *
 * The range filter (`?range=7d|30d|all`, default all) is applied to a single
 * "activity date" per donation: the delivery time when there is one, otherwise
 * when it was created. That keeps one clock for every figure on the page, so the
 * cards, the charts and the table can never disagree with each other.
 *
 * Every figure is real: nothing here is invented, and the page labels the whole
 * thing "Sample data for demonstration" because the rows come from the seed.
 */

const prisma = require('../config/prisma');
const { hasCoordinates, haversineKm } = require('../utils/geo');
const { toKilograms } = require('../services/matching.service');
const { DONOR_SUMMARY, NGO_SUMMARY, toIso, toNumber } = require('../utils/serialize');

/** A kilogram of rescued food is treated as 2.5 servings of 400 g. */
const MEALS_PER_KG = 2.5;

/** Statuses that mean "still in play" — the Active Donations counter. */
const ACTIVE_STATUSES = ['AVAILABLE', 'ACCEPTED', 'ASSIGNED', 'PICKED_UP'];

const RANGE_DAYS = { '7d': 7, '30d': 30 };

const DAY_MS = 24 * 60 * 60 * 1000;

function kilograms(donation) {
  return toKilograms(donation.quantity, donation.quantityUnit);
}

function meals(donation) {
  return Math.round(kilograms(donation) * MEALS_PER_KG);
}

function dayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

/** The single date every range decision and time bucket is measured against. */
function activityDate(donation) {
  return donation.pickup?.deliveryTime || donation.createdAt;
}

/** The donor's display name: the facility for a business, the person otherwise. */
function donorLabel(donor) {
  return donor?.organizationName || donor?.name || 'A donor';
}

/**
 * Volunteer achievement badges, earned from the real totals only. Nothing is
 * awarded that the numbers do not support.
 */
function badgesFor({ completed, mealsRescued, distanceKm }) {
  const badges = [];
  if (completed >= 1) badges.push({ key: 'first-rescue', label: 'First Rescue', tier: 'bronze' });
  if (completed >= 5) badges.push({ key: 'five-rescues', label: 'Five Rescues', tier: 'silver' });
  if (mealsRescued >= 100) badges.push({ key: 'hundred-meals', label: '100 Meals', tier: 'silver' });
  if (distanceKm >= 25) badges.push({ key: 'distance-25', label: '25 km Rescued', tier: 'gold' });
  return badges;
}

async function getImpact(req, res, next) {
  try {
    const { role, id: userId } = req.user;

    const range = typeof req.query.range === 'string' ? req.query.range.toLowerCase() : 'all';
    const normalisedRange = range in RANGE_DAYS || range === 'all' ? range : 'all';
    const days = RANGE_DAYS[normalisedRange] ?? null;
    const since = days ? new Date(Date.now() - days * DAY_MS) : null;

    // --- scope -------------------------------------------------------------
    let where;
    let scope;

    if (role === 'DONOR') {
      scope = 'DONOR';
      where = { donorId: userId };
    } else if (role === 'NGO') {
      scope = 'NGO';
      const ngo = req.user.ngo;
      // An NGO with no profile has handled nothing yet; report zeroes, not an error.
      where = ngo ? { pickup: { is: { ngoId: ngo.id } } } : { id: -1 };
    } else {
      scope = 'VOLUNTEER';
      where = { pickup: { is: { volunteerId: userId } } };
    }

    const donations = await prisma.donation.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        donor: DONOR_SUMMARY,
        pickup: { include: { ngo: NGO_SUMMARY } },
      },
    });

    // --- range -------------------------------------------------------------
    const inRange = donations.filter(
      (donation) => !since || new Date(activityDate(donation)).getTime() >= since.getTime()
    );

    const completed = inRange.filter((donation) => donation.status === 'COMPLETED');
    const active = inRange.filter((donation) => ACTIVE_STATUSES.includes(donation.status));

    const kgRescued = completed.reduce((sum, donation) => sum + kilograms(donation), 0);
    const mealsRescued = completed.reduce((sum, donation) => sum + meals(donation), 0);

    // --- participating organisations --------------------------------------
    const donorIds = new Set();
    const ngoIds = new Set();
    for (const donation of completed) {
      donorIds.add(donation.donorId);
      if (donation.pickup?.ngoId) ngoIds.add(donation.pickup.ngoId);
    }

    // --- meals over time ---------------------------------------------------
    // One bucket per day for the last N days, or from the earliest completed
    // rescue for "all time". Capped at 30 so the axis stays readable.
    const bucketCount = days ?? Math.min(30, Math.max(7, Math.ceil(
      (Date.now() - Math.min(...completed.map((d) => new Date(activityDate(d)).getTime()), Date.now())) / DAY_MS
    ) + 1));

    const buckets = [];
    const today = new Date();
    for (let offset = bucketCount - 1; offset >= 0; offset -= 1) {
      const date = new Date(today.getTime() - offset * DAY_MS);
      buckets.push({ date: dayKey(date), meals: 0, donations: 0 });
    }
    const bucketIndex = new Map(buckets.map((bucket, index) => [bucket.date, index]));
    for (const donation of completed) {
      const index = bucketIndex.get(dayKey(activityDate(donation)));
      if (index === undefined) continue;
      buckets[index].meals += meals(donation);
      buckets[index].donations += 1;
    }

    // --- distributions -----------------------------------------------------
    const statusCounts = new Map();
    for (const donation of inRange) {
      // An open donation past its deadline reads EXPIRED, the same as elsewhere.
      const status =
        donation.status === 'AVAILABLE' &&
        donation.expiryTime &&
        new Date(donation.expiryTime).getTime() <= Date.now()
          ? 'EXPIRED'
          : donation.status;
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    }
    const donationsByStatus = [...statusCounts.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));

    const categoryCounts = new Map();
    for (const donation of inRange) {
      categoryCounts.set(donation.foodCategory, (categoryCounts.get(donation.foodCategory) || 0) + 1);
    }
    const donationsByCategory = [...categoryCounts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

    // --- contributors (donor and NGO views) --------------------------------
    let topContributors = [];
    if (scope !== 'VOLUNTEER') {
      const byDonor = new Map();
      for (const donation of completed) {
        const entry = byDonor.get(donation.donorId) || {
          id: donation.donorId,
          name: donorLabel(donation.donor),
          organizationName: donation.donor?.organizationName || null,
          donations: 0,
          meals: 0,
          kg: 0,
        };
        entry.donations += 1;
        entry.meals += meals(donation);
        entry.kg += kilograms(donation);
        byDonor.set(donation.donorId, entry);
      }
      topContributors = [...byDonor.values()]
        .map((entry) => ({ ...entry, kg: Math.round(entry.kg * 10) / 10 }))
        .sort((a, b) => b.meals - a.meals || a.name.localeCompare(b.name))
        .slice(0, 5);
    }

    // --- volunteer extras --------------------------------------------------
    let volunteer = null;
    if (scope === 'VOLUNTEER') {
      // Straight-line distance from each pickup point to the receiving NGO.
      // There is no route map in the MVP, so this is a lower bound, labelled so.
      let distanceKm = 0;
      for (const donation of completed) {
        const to = donation.pickup?.ngo;
        if (hasCoordinates(donation) && hasCoordinates(to)) {
          distanceKm += haversineKm(donation, to);
        }
      }
      distanceKm = Math.round(distanceKm * 10) / 10;
      volunteer = {
        distanceKm,
        badges: badgesFor({ completed: completed.length, mealsRescued, distanceKm }),
      };
    }

    // --- recent completed --------------------------------------------------
    const recentCompleted = completed
      .slice()
      .sort((a, b) => new Date(activityDate(b)).getTime() - new Date(activityDate(a)).getTime())
      .slice(0, 6)
      .map((donation) => ({
        id: donation.id,
        foodName: donation.foodName,
        foodCategory: donation.foodCategory,
        foodType: donation.foodType,
        quantity: toNumber(donation.quantity),
        quantityUnit: donation.quantityUnit,
        meals: meals(donation),
        kg: Math.round(kilograms(donation) * 10) / 10,
        completedAt: toIso(activityDate(donation)),
        donor: donation.donor
          ? { id: donation.donor.id, name: donorLabel(donation.donor) }
          : undefined,
        ngo: donation.pickup?.ngo
          ? { id: donation.pickup.ngo.id, organizationName: donation.pickup.ngo.organizationName }
          : undefined,
      }));

    return res.json({
      status: 'success',
      scope,
      range: normalisedRange,
      /** The rows behind this page come from the seed; the UI must say so. */
      sampleData: true,
      generatedAt: new Date().toISOString(),
      summary: {
        completedDonations: completed.length,
        mealsRescued,
        kgRescued: Math.round(kgRescued * 10) / 10,
        activeDonations: active.length,
        completedPickups: completed.length,
        participatingOrganisations: donorIds.size + ngoIds.size,
      },
      mealsOverTime: buckets,
      donationsByStatus,
      donationsByCategory,
      topContributors,
      recentCompleted,
      volunteer,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getImpact };
