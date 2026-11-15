/**
 * Donations controller — create, list and read surplus-food donations.
 *
 * Access rules (Architecture.md section 11, "Authorisation"):
 *   DONOR      creates donations and sees its own, at any status
 *   NGO        sees donations that are available, or that it has been matched to
 *   VOLUNTEER  sees available donations (the volunteer module itself is deferred)
 *
 * A donation whose collection deadline has passed is reported as EXPIRED without
 * waiting for a database write: `effectiveStatus` is what the UI shows, while the
 * stored `status` is left alone (PRD FR-09).
 */

const prisma = require('../config/prisma');
const { validateDonation } = require('../utils/validators');
const { checkDonationEligibility, checkNgoEligibility, scoreNgo } = require('../services/matching.service');
const {
  DONOR_SUMMARY,
  NGO_SUMMARY,
  toIso,
  serializeDonation,
} = require('../utils/serialize');

/**
 * The requesting NGO's private view of one donation (Step D).
 *
 * `forYou` is what "Available Donations" sorts and badges on: how far the batch
 * is, what the matching engine would score it for *this* NGO, and — when the NGO
 * is not a candidate — why not. It is additive: donor responses never carry it.
 *
 * `match` is the NGO's stored recommendation for this donation, when one exists.
 * It is what makes the batch claimable (accept takes a matchId), and it carries
 * the score/explanation the engine already computed.
 */
function forYou(donation, ngo, match = null) {
  if (!ngo) return null;

  const check = checkNgoEligibility(ngo, donation);
  const scored = scoreNgo(donation, ngo);

  return {
    eligible: check.eligible,
    reasons: check.reasons,
    score: check.eligible ? scored.score : null,
    distanceKm: scored.distanceKm,
    breakdown: check.eligible ? scored.breakdown : null,
    explanation: check.eligible ? scored.explanation : null,
    matchId: match?.id ?? null,
    matchStatus: match?.status ?? null,
  };
}

/**
 * Record (or refresh) this NGO's recommendation row for a donation, so the NGO
 * has a `matchId` to accept with.
 *
 * Matches are normally written when the donor opens Matching Results. An NGO
 * that reaches a batch from its own feed should still be able to claim it, so
 * the detail read upserts its own row — but only for an open donation the NGO is
 * actually eligible for. That keeps the persisted set identical to what the
 * ranking would produce, which is what `getMatches` prunes against.
 */
async function ensureNgoMatch(donation, ngo) {
  const fields = {
    id: true,
    status: true,
    compatibilityScore: true,
    distance: true,
    explanation: true,
  };

  const existing = await prisma.match.findUnique({
    where: { donationId_ngoId: { donationId: donation.id, ngoId: ngo.id } },
    select: fields,
  });
  if (existing) return existing;

  if (donation.status !== 'AVAILABLE') return null;
  const check = checkDonationEligibility(donation);
  if (!check.eligible) return null;
  if (!checkNgoEligibility(ngo, donation).eligible) return null;

  const scored = scoreNgo(donation, ngo);
  return prisma.match.create({
    data: {
      donationId: donation.id,
      ngoId: ngo.id,
      compatibilityScore: scored.score,
      distance: scored.distanceKm,
      explanation: scored.explanation,
      status: 'PENDING',
    },
    select: fields,
  });
}

/**
 * POST /api/donations
 * Donor only. A donation that fails the safety checks never reaches the table.
 */
async function createDonation(req, res, next) {
  try {
    const { errors, data } = validateDonation(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please correct the highlighted fields.',
        errors,
      });
    }

    const donation = await prisma.donation.create({
      data: {
        donorId: req.user.id,
        foodName: data.foodName,
        foodCategory: data.foodCategory,
        foodType: data.foodType,
        quantity: data.quantity,
        quantityUnit: data.quantityUnit,
        preparationTime: data.preparationTime,
        storageCondition: data.storageCondition,
        expiryTime: data.expiryTime,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        status: 'AVAILABLE',
      },
      include: { donor: DONOR_SUMMARY },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Donation published.',
      donation: serializeDonation(donation),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/donations
 * Role-aware list. `?status=` narrows to one stored status.
 */
async function listDonations(req, res, next) {
  try {
    const { role, id: userId } = req.user;
    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : null;
    const now = new Date();

    const where = {};

    if (role === 'DONOR') {
      where.donorId = userId;
    } else {
      // NGOs and volunteers only ever see food that is still up for grabs.
      where.status = 'AVAILABLE';
      where.expiryTime = { gt: now };
    }

    if (status) where.status = status;

    const donations = await prisma.donation.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        donor: DONOR_SUMMARY,
        pickup: { include: { ngo: NGO_SUMMARY } },
        _count: { select: { matches: true } },
      },
    });

    // An NGO gets its own distance/score for each batch (Step D). Donors and
    // volunteers get the plain shape.
    const viewerNgo = role === 'NGO' ? req.user.ngo : null;

    let matchByDonation = new Map();
    if (viewerNgo && donations.length > 0) {
      const matches = await prisma.match.findMany({
        where: { ngoId: viewerNgo.id, donationId: { in: donations.map((d) => d.id) } },
        select: { id: true, donationId: true, status: true },
      });
      matchByDonation = new Map(matches.map((m) => [m.donationId, m]));
    }

    return res.json({
      status: 'success',
      count: donations.length,
      donations: donations.map((donation) => {
        const serialized = serializeDonation(donation);
        if (!viewerNgo) return serialized;
        return {
          ...serialized,
          forYou: forYou(donation, viewerNgo, matchByDonation.get(donation.id) || null),
        };
      }),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/donations/:id
 * The owner, a matched NGO, or any NGO/volunteer while the donation is available.
 */
async function getDonation(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ status: 'error', message: 'Donation id must be a positive integer.' });
    }

    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        donor: DONOR_SUMMARY,
        pickup: { include: { ngo: NGO_SUMMARY } },
        _count: { select: { matches: true } },
      },
    });

    if (!donation) {
      return res.status(404).json({ status: 'error', message: 'Donation not found.' });
    }

    const serialized = serializeDonation(donation);
    const { role, id: userId } = req.user;

    let allowed = false;
    let myMatch = null;
    let myPickup = null;

    if (role === 'DONOR') {
      allowed = donation.donorId === userId;
    } else if (role === 'NGO') {
      allowed = donation.status === 'AVAILABLE' && !serialized.isExpired;
      if (req.user.ngo?.id) {
        // The requesting NGO's own match row drives the Accept button. When the
        // donation is still open, viewing it records that recommendation so the
        // batch is claimable even if the donor never opened Matching Results.
        const match = await ensureNgoMatch(donation, req.user.ngo);
        myMatch = match
          ? {
              id: match.id,
              status: match.status,
              score: Number(match.compatibilityScore),
              distanceKm: match.distance === null ? null : Number(match.distance),
              explanation: match.explanation,
            }
          : null;

        const ownsPickup = donation.pickup?.ngoId === req.user.ngo.id;
        if (ownsPickup) {
          myPickup = {
            id: donation.pickup.id,
            status: donation.pickup.status,
            pickupTime: toIso(donation.pickup.pickupTime),
            deliveryTime: toIso(donation.pickup.deliveryTime),
          };
        }

        // Matched NGOs (and the accepted one) may always read the donation.
        if (!allowed) allowed = Boolean(match) || ownsPickup;
      }
    } else {
      allowed = donation.status === 'AVAILABLE' && !serialized.isExpired;
    }

    // 404 rather than 403 so the endpoint does not confirm that an id exists.
    if (!allowed) {
      return res.status(404).json({ status: 'error', message: 'Donation not found.' });
    }

    const payload = { ...serialized };
    if (role === 'NGO') {
      payload.myMatch = myMatch;
      payload.myPickup = myPickup;
      payload.forYou = forYou(donation, req.user.ngo, myMatch);
    }

    return res.json({ status: 'success', donation: payload });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/donations/:id/cancel
 * The donor withdraws an unclaimed donation. Anything already accepted must go
 * through the pickup flow instead.
 */
async function cancelDonation(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ status: 'error', message: 'Donation id must be a positive integer.' });
    }

    const donation = await prisma.donation.findUnique({ where: { id } });
    if (!donation || donation.donorId !== req.user.id) {
      return res.status(404).json({ status: 'error', message: 'Donation not found.' });
    }

    if (donation.status !== 'AVAILABLE') {
      return res.status(409).json({
        status: 'error',
        message: `A donation that is ${donation.status.toLowerCase()} cannot be withdrawn.`,
      });
    }

    const updated = await prisma.donation.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { donor: DONOR_SUMMARY, _count: { select: { matches: true } } },
    });

    return res.json({
      status: 'success',
      message: 'Donation withdrawn.',
      donation: serializeDonation(updated),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createDonation,
  listDonations,
  getDonation,
  cancelDonation,
  serializeDonation,
  checkDonationEligibility,
};
