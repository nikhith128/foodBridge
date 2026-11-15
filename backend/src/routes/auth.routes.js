const express = require('express');

const { register, login, me } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register  — create an account
router.post('/register', register);

// POST /api/auth/login     — exchange credentials for a JWT
router.post('/login', login);

// GET  /api/auth/me        — the currently logged-in user
router.get('/me', requireAuth, me);

module.exports = router;
