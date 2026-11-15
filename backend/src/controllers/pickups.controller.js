/**
 * Pickups controller — the NGO side of a claimed donation (Step D).
 *
 * GET   /api/pickups              the NGO's own pickups, newest first
 * PATCH /api/pickups/:id/status   advance PENDING -> PICKED_UP -> COMPLETED
 *
 * Lifecycle. Accepting a donation (POST /api/matches/:matchId/accept) sets the
 * donation to ACCEPTED and opens a PENDING pickup. The Pickup status then tracks
 * the physical handoff, and the donation status mirrors it:
 *
 *   pickup PENDING    + donation ACCEPTED    accepted, awaiting collection
 *   pickup PICKED_UP  + donation PICKED_UP   food collected from the donor
 *   pickup COMPLETED  + donation COMPLETED   food received at the NGO
 *
 * There is no volunteer module yet, so the NGO updates the pickup itself and the
 * donation never enters ASSIGNED (that status belongs to the deferred courier
 * flow). Only the single legal next step is allowed — anything else is a 409.
 */

const prisma = require('../config/prisma');
const { DONOR_SUMMARY, NGO_SUMMARY, serializePickup } = require('../utils/serialize');

/** pickup status -> the only status it may move to, and what that does. */
const TRANSITIONS = {
  PENDING: { next: 'PICKED_UP', donationStatus: 'PICKED_UP', timeField: 'pickupTime' },
  PICKED_UP: { next: 'COMPLETED', donationStatus: 'COMPLETED', timeField: 'deliveryTime' },
};

const PICKUP_INCLUDE = {
  donation: { include: { donor: DONOR_SUMMARY } },
  ngo: NGO_SUMMARY,
};

function readableStatus(status) {
  return status.toLowerCase().replace('_', ' ');
}

/**
 * GET /api/pickups
 * Every pickup this NGO owns, with the donation and the donor attached.
 * `?status=` narrows to one pickup status.
 */
async function listPickups(req, res, next) {
  try {
    const ngo = req.user.ngo;
    if (!ngo) {
      return res
        .status(403)
        .json({ status: 'error', message: 'Your account has no NGO profile.' });
    }

    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : null;
    const where = { ngoId: ngo.id };
    if (status) where.status = status;

    const pickups = await prisma.pickup.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: PICKUP_INCLUDE,
    });

    return res.json({
      status: 'success',
      count: pickups.length,
      pickups: pickups.map(serializePickup),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/pickups/:id/status
 * Body: { "status": "PICKED_UP" | "COMPLETED" }
 */
async function updatePickupStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ status: 'error', message: 'Pickup id must be a positive integer.' });
    }

    const ngo = req.user.ngo;
    if (!ngo) {
      return res.status(403).json({ status: 'error', message: 'Your account has no NGO profile.' });
    }

    const requested =
      typeof req.body?.status === 'string' ? req.body.status.trim().toUpperCase() : null;
    if (!requested) {
      return res.status(400).json({
        status: 'error',
        message: 'A target status is required.',
        errors: [{ field: 'status', message: 'Choose the next pickup step.' }],
      });
    }

    const pickup = await prisma.pickup.findUnique({ where: { id }, include: PICKUP_INCLUDE });

    // 404 rather than 403: never confirm a pickup that belongs to another NGO.
    if (!pickup || pickup.ngoId !== ngo.id) {
      return res.status(404).json({ status: 'error', message: 'Pickup not found.' });
    }

    const rule = TRANSITIONS[pickup.status];
    if (!rule) {
      return res.status(409).json({
        status: 'error',
        message: 'This pickup is already complete.',
      });
    }

    if (requested !== rule.next) {
      return res.status(409).json({
        status: 'error',
        message: `A ${readableStatus(pickup.status)} pickup can only move to ${rule.next}.`,
      });
    }

    if (pickup.donation.status === 'CANCELLED') {
      return res
        .status(409)
        .json({ status: 'error', message: 'The donor has withdrawn this donation.' });
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.pickup.update({
        where: { id },
        data: { status: rule.next, [rule.timeField]: now },
      });
      await tx.donation.update({
        where: { id: pickup.donationId },
        data: { status: rule.donationStatus },
      });
    });

    const updated = await prisma.pickup.findUnique({ where: { id }, include: PICKUP_INCLUDE });

    return res.json({
      status: 'success',
      message:
        rule.next === 'PICKED_UP'
          ? 'Pickup recorded. Confirm the delivery once the food reaches your kitchen.'
          : 'Delivery confirmed. Thank you for rescuing this batch.',
      pickup: serializePickup(updated),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listPickups, updatePickupStatus };
