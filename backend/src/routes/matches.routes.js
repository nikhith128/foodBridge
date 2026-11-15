const express = require('express');

const { getMatches, acceptMatch } = require('../controllers/matches.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// GET /api/matches/:donationId — ranked NGO recommendations (owner donor only)
router.get('/:donationId', requireRole('DONOR'), getMatches);

// POST /api/matches/:matchId/accept — claim a recommended donation (NGO only)
router.post('/:matchId/accept', requireRole('NGO'), acceptMatch);

module.exports = router;
