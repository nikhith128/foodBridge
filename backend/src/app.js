/**
 * Express application builder.
 *
 * Kept separate from server.js so the app can be started without binding a
 * port — which is what the smoke test in scripts/smoke-auth.js does.
 *
 * NOTE: this is a small addition to the folder list in Architecture.md §6,
 * which only names server.js. It is the standard Express split and makes the
 * auth endpoints testable end to end.
 */

// `quiet` suppresses dotenv's startup banner so command output stays readable.
require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');

const prisma = require('./config/prisma');
const authRoutes = require('./routes/auth.routes');
const donationRoutes = require('./routes/donations.routes');
const matchRoutes = require('./routes/matches.routes');
const pickupRoutes = require('./routes/pickups.routes');
const impactRoutes = require('./routes/impact.routes');

const app = express();

// --- Global middleware ---------------------------------------------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health check --------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'unreachable',
      message: error.message,
    });
  }
});

// --- Feature routes ------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/impact', impactRoutes);

// --- 404 for unknown API routes ------------------------------------------
app.use('/api', (_req, res) => {
  res.status(404).json({ status: 'error', message: 'API route not found' });
});

// --- Central error handler ----------------------------------------------
// Express identifies this as an error handler by its four arguments.
// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  // Malformed JSON bodies arrive here from express.json().
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'error', message: 'Request body is not valid JSON.' });
  }

  console.error(error);
  return res.status(error.status || 500).json({
    status: 'error',
    message: error.message || 'Internal server error',
  });
});

module.exports = app;
