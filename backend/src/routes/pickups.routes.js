const express = require('express');

const { listPickups, updatePickupStatus } = require('../controllers/pickups.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Every pickup route needs a session; only NGOs own pickups today.
router.use(requireAuth);

// GET   /api/pickups              — this NGO's pickups (donation + donor attached)
router.get('/', requireRole('NGO'), listPickups);

// PATCH /api/pickups/:id/status   — advance PENDING -> PICKED_UP -> COMPLETED
router.patch('/:id/status', requireRole('NGO'), updatePickupStatus);

module.exports = router;
