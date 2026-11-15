const express = require('express');

const { getImpact } = require('../controllers/impact.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Any signed-in role can read the impact board; the controller scopes the rows.
// GET /api/impact?range=7d|30d|all
router.get('/', requireAuth, getImpact);

module.exports = router;
