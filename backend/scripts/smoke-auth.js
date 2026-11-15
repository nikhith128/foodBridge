/**
 * Auth smoke test for Step B1.
 *
 * Proves every behaviour promised for this step over real HTTP:
 *   201 register | 409 duplicate | 400 validation | 401 bad login
 *   401 missing/tampered token | 200 me | 403 wrong role
 *
 * Run:  node scripts/smoke-auth.js
 * Creates a few `smoke.*@foodbridge.test` accounts and deletes them again.
 */

const express = require('express');

const realApp = require('../src/app');
const { requireAuth, requireRole } = require('../src/middleware/auth');
const prisma = require('../src/config/prisma');

/**
 * The real app mounts its `/api` 404 catch-all before any route we could add
 * afterwards, so role enforcement is exercised on a minimal app that uses the
 * *real* middleware and the *real* database. Everything else runs against the
 * real app.
 */
const roleApp = express();
roleApp.use(express.json());
roleApp.get('/api/_test/ngo-only', requireAuth, requireRole('NGO'), (_req, res) => {
  res.json({ status: 'ok', message: 'NGO-only route reached.' });
});

const results = [];

function check(name, condition, detail = '') {
  const pass = Boolean(condition);
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `   [${detail}]` : ''}`);
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function main() {
  const realServer = await listen(realApp);
  const roleServer = await listen(roleApp);

  const real = `http://localhost:${realServer.address().port}`;
  const role = `http://localhost:${roleServer.address().port}`;

  const stamp = Date.now();
  const donorEmail = `smoke.donor.${stamp}@foodbridge.test`;
  const ngoEmail = `smoke.ngo.${stamp}@foodbridge.test`;
  const PASSWORD = 'Password123';

  const post = (url, body) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const get = (url, token) =>
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

  // --- 1. Register a donor ------------------------------------------------
  let res = await post(`${real}/api/auth/register`, {
    name: 'Smoke Donor',
    email: donorEmail,
    password: PASSWORD,
    role: 'DONOR',
    donorType: 'Restaurant / Bistro',
  });
  let body = await res.json();
  check('register donor -> 201', res.status === 201, `status ${res.status}`);
  check('register returns a token', typeof body.token === 'string' && body.token.length > 20);
  check('register never returns password', body.user?.password === undefined);
  check('donor facility type stored', body.user?.donorType === 'Restaurant / Bistro', body.user?.donorType);
  const donorToken = body.token;

  // --- 2. Duplicate email -------------------------------------------------
  res = await post(`${real}/api/auth/register`, {
    name: 'Smoke Donor Again',
    email: donorEmail,
    password: PASSWORD,
    role: 'DONOR',
  });
  check('duplicate email -> 409', res.status === 409, `status ${res.status}`);

  // --- 3. Validation ------------------------------------------------------
  res = await post(`${real}/api/auth/register`, {
    name: 'X',
    email: 'not-an-email',
    password: 'short',
    role: 'WIZARD',
  });
  body = await res.json();
  check('invalid input -> 400', res.status === 400, `status ${res.status}`);
  check(
    'invalid input reports all 4 fields',
    Array.isArray(body.errors) && body.errors.length === 4,
    `${body.errors?.length} errors: ${body.errors?.map((e) => e.field).join(', ')}`
  );

  // --- 4. Register an NGO -------------------------------------------------
  res = await post(`${real}/api/auth/register`, {
    name: 'Smoke NGO',
    email: ngoEmail,
    password: PASSWORD,
    role: 'NGO',
    organizationName: 'Smoke Trust (Demo)',
    address: '1 Test Road, Demo City',
    storageCapacity: 90,
    capacityNotes: 'Walk-in chiller, 90 kg per day',
    foodPreference: ['Cooked Hot Meals', 'Fresh Produce'],
  });
  body = await res.json();
  check('register NGO -> 201', res.status === 201, `status ${res.status}`);
  check('NGO profile auto-created', Boolean(body.user?.ngo));
  check('new NGO is PENDING', body.user?.ngo?.verificationStatus === 'PENDING', body.user?.ngo?.verificationStatus);
  check(
    'NGO food preference stored',
    body.user?.ngo?.foodPreference === 'Cooked Hot Meals, Fresh Produce',
    body.user?.ngo?.foodPreference
  );
  const ngoToken = body.token;

  // --- 5. NGO without an address is rejected ------------------------------
  res = await post(`${real}/api/auth/register`, {
    name: 'Bad NGO',
    email: `smoke.bad.${stamp}@foodbridge.test`,
    password: PASSWORD,
    role: 'NGO',
    organizationName: 'No Address Trust',
    storageCapacity: 10,
  });
  check('NGO without address -> 400', res.status === 400, `status ${res.status}`);

  // --- 6. Login -----------------------------------------------------------
  res = await post(`${real}/api/auth/login`, { email: donorEmail, password: PASSWORD });
  body = await res.json();
  check('login with correct password -> 200', res.status === 200, `status ${res.status}`);
  check('login returns a token', typeof body.token === 'string');

  // --- 7. Wrong password --------------------------------------------------
  res = await post(`${real}/api/auth/login`, { email: donorEmail, password: 'WrongPass123' });
  check('wrong password -> 401', res.status === 401, `status ${res.status}`);

  // --- 8. Unknown email gives the same message ----------------------------
  res = await post(`${real}/api/auth/login`, {
    email: `nobody.${stamp}@foodbridge.test`,
    password: PASSWORD,
  });
  const unknown = await res.json();
  check('unknown email -> 401', res.status === 401, `status ${res.status}`);
  check(
    'unknown email message identical to wrong password',
    unknown.message === 'Incorrect email or password.',
    unknown.message
  );

  // --- 9. Protected route without a token ---------------------------------
  res = await get(`${real}/api/auth/me`);
  check('GET /me without token -> 401', res.status === 401, `status ${res.status}`);

  // --- 10. Protected route with a token -----------------------------------
  res = await get(`${real}/api/auth/me`, donorToken);
  body = await res.json();
  check('GET /me with token -> 200', res.status === 200, `status ${res.status}`);
  check('GET /me returns the right user', body.user?.email === donorEmail, body.user?.email);
  check('GET /me never returns password', body.user?.password === undefined);

  // --- 11. Tampered token -------------------------------------------------
  res = await get(`${real}/api/auth/me`, `${donorToken.slice(0, -3)}xyz`);
  check('tampered token -> 401', res.status === 401, `status ${res.status}`);

  // --- 12. Role enforcement ----------------------------------------------
  res = await get(`${role}/api/_test/ngo-only`, donorToken);
  check('DONOR on an NGO-only route -> 403', res.status === 403, `status ${res.status}`);
  res = await get(`${role}/api/_test/ngo-only`, ngoToken);
  check('NGO on an NGO-only route -> 200', res.status === 200, `status ${res.status}`);

  // --- 13. Housekeeping ---------------------------------------------------
  res = await get(`${real}/api/does-not-exist`);
  check('unknown API route -> 404', res.status === 404, `status ${res.status}`);

  res = await fetch(`${real}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ this is not json',
  });
  check('malformed JSON body -> 400', res.status === 400, `status ${res.status}`);

  const removed = await prisma.user.deleteMany({ where: { email: { startsWith: 'smoke.' } } });
  console.log(`\nCleaned up ${removed.count} smoke-test account(s).`);

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);

  realServer.close();
  roleServer.close();
  await prisma.$disconnect();
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error('\nSmoke test crashed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
