/**
 * Matches controller — the ranked NGO recommendations for one donation.
 *
 * GET /api/matches/:donationId
 *   Recomputes the ranking from the donation's current data and the current NGO
 *   roster, then stores the result so Step D can accept a specific `matchId`.
 *   Recomputing on every read (rather than only at creation) means a recommendation
 *   always reflects the live deadline and capacity, and a donation that has since
 *   expired stops being recommended.
 *
 * Only the donor who owns the donation may ask for its matches.
 */

const prisma = require('../config/prisma');
const {
  rankNgos,
  checkDonationEligibility,
  checkNgoEligibility,
  WEIGHTS,
} = require('../services/matching.service');
const { DONOR_SUMMARY, NGO_SUMMARY, serializeDonation } = require('../utils/serialize');

function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

async function getMatches(req, res, next) {
  try {
    const donationId = Number(req.params.donationId);
    if (!Number.isInteger(donationId) || donationId <= 0) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Donation id must be a positive integer.' });
    }

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { donor: DONOR_SUMMARY },
    });

    if (!donation || donation.donorId !== req.user.id) {
      // 404 rather than 403 so the endpoint never confirms an id it does not own.
      return res.status(404).json({ status: 'error', message: 'Donation not found.' });
    }

    const donationSummary = {
      id: donation.id,
      foodName: donation.foodName,
      foodCategory: donation.foodCategory,
      foodType: donation.foodType,
      quantity: Number(donation.quantity),
      quantityUnit: donation.quantityUnit,
      preparationTime: toIso(donation.preparationTime),
      storageCondition: donation.storageCondition,
      expiryTime: toIso(donation.expiryTime),
      latitude: donation.latitude === null ? null : Number(donation.latitude),
      longitude: donation.longitude === null ? null : Number(donation.longitude),
      description: donation.description,
      status: donation.status,
      donor: donation.donor
        ? {
            id: donation.donor.id,
            name: donation.donor.name,
            organizationName: donation.donor.organizationName,
          }
        : undefined,
    };

    // --- 1. Donation-side eligibility gate ---------------------------------
    const eligibility = checkDonationEligibility(donation);
    if (!eligibility.eligible) {
      return res.json({
        status: 'success',
        eligible: false,
        reasons: eligibility.reasons,
        donation: donationSummary,
        weights: WEIGHTS,
        recommendations: [],
      });
    }

    // --- 2 & 3. Filter, score and rank ------------------------------------
    const ngos = await prisma.ngo.findMany({
      orderBy: { organizationName: 'asc' },
      include: { user: { select: { name: true, phone: true } } },
    });

    const ranked = rankNgos(donation, ngos);

    // --- Persist so Step D can accept a matchId ----------------------------
    // ACCEPTED / REJECTED rows keep their status; only the numbers are refreshed.
    const keepIds = ranked.recommendations.map((r) => r.ngoId);
    await prisma.$transaction([
      prisma.match.deleteMany({
        where: { donationId, status: 'PENDING', ngoId: { notIn: keepIds } },
      }),
      ...ranked.recommendations.map((r) =>
        prisma.match.upsert({
          where: { donationId_ngoId: { donationId, ngoId: r.ngoId } },
          update: {
            compatibilityScore: r.score,
            distance: r.distanceKm,
            explanation: r.explanation,
          },
          create: {
            donationId,
            ngoId: r.ngoId,
            compatibilityScore: r.score,
            distance: r.distanceKm,
            explanation: r.explanation,
            status: 'PENDING',
          },
        })
      ),
    ]);

    // Read the ids back so the response carries the matchId for each NGO.
    const stored = await prisma.match.findMany({
      where: { donationId },
      select: { id: true, ngoId: true, status: true },
    });
    const matchIdByNgo = new Map(stored.map((m) => [m.ngoId, m]));

    const recommendations = ranked.recommendations.map((r, index) => ({
      rank: index + 1,
      matchId: matchIdByNgo.get(r.ngoId)?.id ?? null,
      matchStatus: matchIdByNgo.get(r.ngoId)?.status ?? 'PENDING',
      score: r.score,
      distanceKm: r.distanceKm,
      breakdown: r.breakdown,
      explanation: r.explanation,
      ngo: {
        id: r.ngo.id,
        organizationName: r.ngo.organizationName,
        address: r.ngo.address,
        latitude: r.ngo.latitude === null ? null : Number(r.ngo.latitude),
        longitude: r.ngo.longitude === null ? null : Number(r.ngo.longitude),
        storageCapacity: Number(r.ngo.storageCapacity),
        capacityNotes: r.ngo.capacityNotes,
        foodPreference: r.ngo.foodPreference,
        verificationStatus: r.ngo.verificationStatus,
        contactName: r.ngo.user?.name ?? null,
        contactPhone: r.ngo.user?.phone ?? null,
      },
    }));

    return res.json({
      status: 'success',
      eligible: true,
      reasons: [],
      donation: donationSummary,
      weights: WEIGHTS,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/matches/:matchId/accept
 * The NGO claims a donation it was recommended for.
 *
 * The whole point of Step D is that two NGOs can never both win: the donation
 * status flips from AVAILABLE inside a transaction with a *conditional* update,
 * so whichever request gets there second matches zero rows and is refused. The
 * same transaction records the accepted match, releases the sibling
 * recommendations, and opens the PENDING pickup.
 *
 * Re-checked on accept, not just on read: the deadline may have passed, the
 * donor may have withdrawn the batch, or the NGO's own eligibility may have
 * changed since the recommendation was computed.
 */
async function acceptMatch(req, res, next) {
  try {
    const matchId = Number(req.params.matchId);
    if (!Number.isInteger(matchId) || matchId <= 0) {
      return res.status(400).json({ status: 'error', message: 'Match id must be a positive integer.' });
    }

    const ngo = req.user.ngo;
    if (!ngo) {
      return res
        .status(403)
        .json({ status: 'error', message: 'Your account has no NGO profile to accept with.' });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { donation: { include: { donor: DONOR_SUMMARY } } },
    });

    // 404 rather than 403: never confirm a match that belongs to another NGO.
    if (!match || match.ngoId !== ngo.id) {
      return res.status(404).json({ status: 'error', message: 'Match not found.' });
    }

    if (match.status === 'ACCEPTED') {
      return res.status(409).json({ status: 'error', message: 'You have already accepted this donation.' });
    }
    if (match.status === 'REJECTED') {
      return res
        .status(409)
        .json({ status: 'error', message: 'This recommendation is no longer open.' });
    }

    const { donation } = match;

    if (donation.status !== 'AVAILABLE') {
      return res.status(409).json({
        status: 'error',
        message:
          donation.status === 'CANCELLED'
            ? 'The donor has withdrawn this donation.'
            : 'This donation has already been claimed.',
      });
    }

    const donationCheck = checkDonationEligibility(donation);
    if (!donationCheck.eligible) {
      return res.status(409).json({
        status: 'error',
        message: donationCheck.reasons[0],
        reasons: donationCheck.reasons,
      });
    }

    const ngoCheck = checkNgoEligibility(ngo, donation);
    if (!ngoCheck.eligible) {
      return res.status(409).json({
        status: 'error',
        message: ngoCheck.reasons[0],
        reasons: ngoCheck.reasons,
      });
    }

    const outcome = await prisma.$transaction(async (tx) => {
      // The gate: only one caller can move the donation out of AVAILABLE.
      const claim = await tx.donation.updateMany({
        where: { id: donation.id, status: 'AVAILABLE' },
        data: { status: 'ACCEPTED' },
      });
      if (claim.count === 0) return { conflict: true };

      await tx.match.update({ where: { id: match.id }, data: { status: 'ACCEPTED' } });
      await tx.match.updateMany({
        where: { donationId: donation.id, id: { not: match.id }, status: 'PENDING' },
        data: { status: 'REJECTED' },
      });

      const pickup = await tx.pickup.create({
        data: { donationId: donation.id, ngoId: ngo.id, status: 'PENDING' },
      });

      const updatedDonation = await tx.donation.findUnique({
        where: { id: donation.id },
        include: {
          donor: DONOR_SUMMARY,
          pickup: { include: { ngo: NGO_SUMMARY } },
          _count: { select: { matches: true } },
        },
      });

      return { conflict: false, pickup, updatedDonation };
    });

    if (outcome.conflict) {
      return res
        .status(409)
        .json({ status: 'error', message: 'This donation has already been claimed.' });
    }

    return res.status(200).json({
      status: 'success',
      message: `You have accepted "${donation.foodName}". Please collect it before the deadline.`,
      match: { id: match.id, status: 'ACCEPTED' },
      pickup: { id: outcome.pickup.id, status: outcome.pickup.status },
      donation: serializeDonation(outcome.updatedDonation),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getMatches, acceptMatch };
