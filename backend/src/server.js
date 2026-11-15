/**
 * FoodBridge AI — server entry point.
 *
 * The app itself is built in app.js; this file only binds a port and reports
 * obvious configuration mistakes at startup.
 */

const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 5000;

// Fail loudly at startup rather than on the first login attempt.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error(
    'FATAL: JWT_SECRET is missing or too short.\n' +
      '       Copy backend/.env.example to backend/.env and set a long random value.'
  );
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`FoodBridge AI API listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Close the database connection cleanly on Ctrl+C.
async function shutdown() {
  console.log('\nShutting down...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
