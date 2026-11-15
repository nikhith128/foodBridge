const express = require('express');

const {
  createDonation,
  listDonations,
  getDonation,
  cancelDonation,
} = require('../controllers/donations.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Every donation route needs a session; role rules are applied per route.
router.use(requireAuth);

// POST /api/donations            — publish a donation (donor only)
router.post('/', requireRole('DONOR'), createDonation);

// GET  /api/donations            — the caller's donations (donor) or available ones (NGO / volunteer)
router.get('/', listDonations);

// GET  /api/donations/:id        — one donation, subject to the access rules
router.get('/:id', getDonation);

// PATCH /api/donations/:id/cancel — withdraw an unclaimed donation (donor only)
router.patch('/:id/cancel', requireRole('DONOR'), cancelDonation);

module.exports = router;
