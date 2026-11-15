/**
 * Matching smoke test for Step C.
 *
 * Two halves:
 *   A. pure unit checks on the engine — eligibility filters, the four weighted
 *      factors, ranking and explanations. No database, no HTTP.
 *   B. an end-to-end run over real HTTP against the real app and the real
 *      database: a donor publishes a donation and gets back ranked NGOs.
 *
 * Run:  node scripts/smoke-matching.js
 * Creates a few `smoke.*@foodbridge.test` rows and deletes them again.
 */

const realApp = require('../src/app');
const prisma = require('../src/config/prisma');
const geo = require('../src/utils/geo');
const { validateDonation } = require('../src/utils/validators');
const matching = require('../src/services/matching.service');

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

const HOUR = 60 * 60 * 1000;

/** A valid donation body, `overrides` tweak one field at a time. */
function donationBody(overrides = {}) {
  return {
    foodName: 'Smoke Test Biryani',
    foodCategory: 'Cooked Hot Meals',
    foodType: 'NON_VEG',
    quantity: 20,
    quantityUnit: 'kg',
    preparationTime: new Date(Date.now() - 2 * HOUR).toISOString(),
    storageCondition: 'Hot holding above 60 C',
    expiryTime: new Date(Date.now() + 6 * HOUR).toISOString(),
    latitude: 17.385044,
    longitude: 78.486671,
    description: 'Smoke test donation.',
    ...overrides,
  };
}

/** A fully eligible NGO; `overrides` change one property at a time. */
function ngoRow(overrides = {}) {
  return {
    id: 1,
    organizationName: 'Unit Test NGO',
    latitude: 17.397044,
    longitude: 78.494671,
    storageCapacity: 120,
    foodPreference: 'Cooked Hot Meals, Fresh Produce',
    verificationStatus: 'VERIFIED',
    isAccepting: true,
    ...overrides,
  };
}

function unitTests() {
  console.log('--- A. engine unit checks ---\n');

  // --- geo ---------------------------------------------------------------
  check('haversine: a point is 0 km from itself', geo.haversineKm(
    { latitude: 17.385044, longitude: 78.486671 },
    { latitude: 17.385044, longitude: 78.486671 }
  ) === 0);

  const d = geo.haversineKm(
    { latitude: 17.385044, longitude: 78.486671 },
    { latitude: 17.397044, longitude: 78.494671 }
  );
  check('haversine: the seed offset is ~1.5 km', d > 1.4 && d < 1.7, `${d} km`);

  const reverse = geo.haversineKm(
    { latitude: 17.397044, longitude: 78.494671 },
    { latitude: 17.385044, longitude: 78.486671 }
  );
  check('haversine: symmetric', d === reverse);

  check('hasCoordinates: rejects null', geo.hasCoordinates(null) === false);
  check('hasCoordinates: rejects a half point', geo.hasCoordinates({ latitude: 1, longitude: null }) === false);
  check('hasCoordinates: accepts numeric strings', geo.hasCoordinates({ latitude: '17.4', longitude: '78.5' }) === true);
  check('hasCoordinates: rejects out-of-range latitude', geo.hasCoordinates({ latitude: 200, longitude: 0 }) === false);

  // --- donation validation ----------------------------------------------
  check('validateDonation: a complete body passes', validateDonation(donationBody()).errors.length === 0);

  const missingPrep = validateDonation(donationBody({ preparationTime: '' })).errors.map((e) => e.field);
  check('validateDonation: missing preparation time is rejected', missingPrep.includes('preparationTime'), missingPrep.join(','));

  const missingStorage = validateDonation(donationBody({ storageCondition: '' })).errors.map((e) => e.field);
  check('validateDonation: missing storage condition is rejected', missingStorage.includes('storageCondition'));

  const pastDeadline = validateDonation(donationBody({ expiryTime: new Date(Date.now() - HOUR).toISOString() })).errors.map((e) => e.field);
  check('validateDonation: a past deadline is rejected', pastDeadline.includes('expiryTime'));

  const futurePrep = validateDonation(donationBody({ preparationTime: new Date(Date.now() + HOUR).toISOString() })).errors.map((e) => e.field);
  check('validateDonation: a future preparation time is rejected', futurePrep.includes('preparationTime'));

  const badCategory = validateDonation(donationBody({ foodCategory: 'Pizza' })).errors.map((e) => e.field);
  check('validateDonation: an unknown category is rejected', badCategory.includes('foodCategory'));

  const zeroQty = validateDonation(donationBody({ quantity: 0 })).errors.map((e) => e.field);
  check('validateDonation: zero quantity is rejected', zeroQty.includes('quantity'));

  const halfPoint = validateDonation(donationBody({ longitude: '' })).errors.map((e) => e.field);
  check('validateDonation: a half-specified location is rejected', halfPoint.includes('latitude'));

  check(
    'validateDonation: the weights total 100%',
    Object.values(matching.WEIGHTS).reduce((sum, w) => sum + w, 0) === 1
  );

  // --- eligibility -------------------------------------------------------
  const donation = {
    ...donationBody(),
    quantity: 20,
    status: 'AVAILABLE',
    preparationTime: new Date(Date.now() - 2 * HOUR),
    expiryTime: new Date(Date.now() + 6 * HOUR),
  };

  check('eligibility: a fresh AVAILABLE donation passes', matching.checkDonationEligibility(donation).eligible);
  check(
    'eligibility: an expired deadline fails',
    matching.checkDonationEligibility({ ...donation, expiryTime: new Date(Date.now() - HOUR) }).eligible === false
  );
  check(
    'eligibility: a claimed donation fails',
    matching.checkDonationEligibility({ ...donation, status: 'ACCEPTED' }).eligible === false
  );
  check(
    'eligibility: a donation with no pickup point fails',
    matching.checkDonationEligibility({ ...donation, latitude: null, longitude: null }).eligible === false
  );

  check('eligibility: a verified, accepting NGO passes', matching.checkNgoEligibility(ngoRow(), donation).eligible);
  check(
    'eligibility: an unverified NGO is filtered out',
    matching.checkNgoEligibility(ngoRow({ verificationStatus: 'PENDING' }), donation).eligible === false
  );
  check(
    'eligibility: an NGO that is not accepting is filtered out',
    matching.checkNgoEligibility(ngoRow({ isAccepting: false }), donation).eligible === false
  );
  check(
    'eligibility: an NGO with no location is filtered out',
    matching.checkNgoEligibility(ngoRow({ latitude: null, longitude: null }), donation).eligible === false
  );
  check(
    'eligibility: an NGO with no capacity is filtered out',
    matching.checkNgoEligibility(ngoRow({ storageCapacity: 0 }), donation).eligible === false
  );
  check(
    'eligibility: a vegetarian-only kitchen is filtered out for non-veg food',
    matching.checkNgoEligibility(ngoRow({ foodPreference: 'Vegetarian Only' }), donation).eligible === false
  );
  check(
    'eligibility: the same kitchen is allowed for veg food',
    matching.checkNgoEligibility(ngoRow({ foodPreference: 'Vegetarian Only' }), { ...donation, foodType: 'VEG' })
      .eligible === true
  );

  // --- scoring -----------------------------------------------------------
  const score = matching.scoreNgo(donation, ngoRow());
  check('score: is a percentage between 0 and 100', score.score >= 0 && score.score <= 100, `${score.score}`);
  check('score: carries a distance in km', typeof score.distanceKm === 'number' && score.distanceKm > 0);
  check('score: breaks down into the four factors', Object.keys(score.breakdown).length === 4);
  check(
    'score: every factor is a 0-100 integer',
    Object.values(score.breakdown).every((v) => Number.isInteger(v) && v >= 0 && v <= 100)
  );
  check('score: explanation names the NGO', score.explanation.includes('Unit Test NGO'));
  check('score: explanation quotes the distance', score.explanation.includes(`${score.distanceKm} km`));

  const nearby = matching.scoreNgo(donation, ngoRow({ id: 2, latitude: 17.386, longitude: 78.487 }));
  const faraway = matching.scoreNgo(donation, ngoRow({ id: 3, latitude: 17.6, longitude: 78.7 }));
  check('score: a nearer NGO scores higher', nearby.score > faraway.score, `${nearby.score} vs ${faraway.score}`);

  // --- ranking -----------------------------------------------------------
  const ranked = matching.rankNgos(donation, [
    ngoRow({ id: 10, organizationName: 'Unverified', verificationStatus: 'PENDING' }),
    ngoRow({ id: 11, organizationName: 'Veg Only', foodPreference: 'Vegetarian Only' }),
    ngoRow({ id: 12, organizationName: 'Best Bet', latitude: 17.386, longitude: 78.487, storageCapacity: 200 }),
    ngoRow({ id: 13, organizationName: 'Far Away', latitude: 17.6, longitude: 78.7 }),
  ]);

  check('ranking: eligible flag is true', ranked.eligible === true);
  check('ranking: only the two eligible NGOs survive', ranked.recommendations.length === 2, `${ranked.recommendations.length}`);
  check('ranking: sorted highest score first', ranked.recommendations[0].score >= ranked.recommendations[1].score);
  check('ranking: the best bet is ranked first', ranked.recommendations[0].ngo.organizationName === 'Best Bet');

  const ineligible = matching.rankNgos({ ...donation, expiryTime: new Date(Date.now() - HOUR) }, [ngoRow()]);
  check('ranking: an ineligible donation yields no recommendations', ineligible.eligible === false && ineligible.recommendations.length === 0);
  check('ranking: the refusal carries a reason', ineligible.reasons.length > 0, ineligible.reasons[0]);

  console.log('');
}

async function httpTests(server) {
  console.log('--- B. end-to-end over HTTP ---\n');

  const base = `http://localhost:${server.address().port}`;
  const stamp = Date.now();
  const PASSWORD = 'Password123';
  const donorEmail = `smoke.matching.donor.${stamp}@foodbridge.test`;
  const ngoAEmail = `smoke.matching.ngoa.${stamp}@foodbridge.test`;
  const ngoBEmail = `smoke.matching.ngob.${stamp}@foodbridge.test`;

  const post = (path, body, token) =>
    fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  const get = (path, token) =>
    fetch(`${base}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

  const register = async (payload) => {
    const res = await post('/api/auth/register', payload);
    return { res, body: await res.json() };
  };

  const donor = await register({
    name: 'Smoke Matching Donor',
    email: donorEmail,
    password: PASSWORD,
    role: 'DONOR',
    donorType: 'Restaurant / Bistro',
  });
  check('HTTP: donor registered', donor.res.status === 201, `status ${donor.res.status}`);
  const donorToken = donor.body.token;

  const ngoA = await register({
    name: 'Smoke Matching NGO A',
    email: ngoAEmail,
    password: PASSWORD,
    role: 'NGO',
    organizationName: 'Smoke Alpha Trust (Demo)',
    address: '1 Alpha Road, Demo City',
    storageCapacity: 150,
    foodPreference: ['Cooked Hot Meals', 'Fresh Produce'],
  });
  const ngoB = await register({
    name: 'Smoke Matching NGO B',
    email: ngoBEmail,
    password: PASSWORD,
    role: 'NGO',
    organizationName: 'Smoke Beta Trust (Demo)',
    address: '2 Beta Road, Demo City',
    storageCapacity: 60,
    foodPreference: ['Cooked Hot Meals'],
  });
  check('HTTP: two NGOs registered', ngoA.res.status === 201 && ngoB.res.status === 201);

  // A freshly registered NGO is PENDING, so approve and locate them directly.
  await prisma.ngo.update({
    where: { id: ngoA.body.user.ngo.id },
    data: { verificationStatus: 'VERIFIED', latitude: 17.397044, longitude: 78.494671 },
  });
  await prisma.ngo.update({
    where: { id: ngoB.body.user.ngo.id },
    data: { verificationStatus: 'VERIFIED', latitude: 17.42, longitude: 78.52 },
  });

  // --- create ------------------------------------------------------------
  let res = await post('/api/donations', donationBody({ foodName: 'HTTP Smoke Biryani' }), donorToken);
  let body = await res.json();
  check('HTTP: create donation -> 201', res.status === 201, `status ${res.status}`);
  check('HTTP: new donation is AVAILABLE', body.donation?.status === 'AVAILABLE');
  check('HTTP: response includes the donor summary', body.donation?.donor?.email === undefined && body.donation?.donor?.name === 'Smoke Matching Donor');
  const donationId = body.donation?.id;

  res = await post('/api/donations', donationBody({ storageCondition: '' }), donorToken);
  body = await res.json();
  check('HTTP: create without storage -> 400', res.status === 400, `status ${res.status}`);
  check('HTTP: the error names the field', body.errors?.some((e) => e.field === 'storageCondition'));

  res = await post('/api/donations', donationBody(), ngoA.body.token);
  check('HTTP: an NGO cannot create a donation -> 403', res.status === 403, `status ${res.status}`);

  // --- list / read -------------------------------------------------------
  res = await get('/api/donations', donorToken);
  body = await res.json();
  check('HTTP: the donor sees their own donation', body.donations?.some((d) => d.id === donationId));

  res = await get(`/api/donations/${donationId}`, donorToken);
  body = await res.json();
  check('HTTP: the donor can read their donation', res.status === 200 && body.donation?.id === donationId);

  res = await get('/api/donations', ngoA.body.token);
  body = await res.json();
  check('HTTP: an NGO sees available donations', body.donations?.some((d) => d.id === donationId));

  // --- matches -----------------------------------------------------------
  res = await get(`/api/matches/${donationId}`, donorToken);
  body = await res.json();
  check('HTTP: matches -> 200', res.status === 200, `status ${res.status}`);
  check('HTTP: the donation is eligible', body.eligible === true);
  const recNgoIds = (body.recommendations || []).map((r) => r.ngo.id);
  check(
    'HTTP: both smoke NGOs are recommended',
    recNgoIds.includes(ngoA.body.user.ngo.id) && recNgoIds.includes(ngoB.body.user.ngo.id)
  );
  check('HTTP: at least the two smoke NGOs are ranked', body.recommendations?.length >= 2, `${body.recommendations?.length}`);
  check('HTTP: recommendations are ranked from 1', body.recommendations?.[0]?.rank === 1);
  check(
    'HTTP: scores are sorted descending',
    body.recommendations?.[0]?.score >= body.recommendations?.[1]?.score
  );
  check('HTTP: each recommendation carries a matchId', body.recommendations?.every((r) => Number.isInteger(r.matchId)));
  check('HTTP: each recommendation carries an explanation', body.recommendations?.every((r) => typeof r.explanation === 'string' && r.explanation.length > 20));
  check('HTTP: the response echoes the weights', body.weights?.capacity === 0.3);

  const storedMatches = await prisma.match.count({ where: { donationId } });
  check(
    'HTTP: one match row was persisted per recommendation',
    storedMatches === body.recommendations.length,
    `${storedMatches} rows`
  );

  res = await get(`/api/matches/${donationId}`, ngoA.body.token);
  check('HTTP: an NGO cannot read another donor\'s matches -> 403', res.status === 403, `status ${res.status}`);

  // --- expiry ------------------------------------------------------------
  await prisma.donation.update({ where: { id: donationId }, data: { expiryTime: new Date(Date.now() - HOUR) } });
  res = await get(`/api/matches/${donationId}`, donorToken);
  body = await res.json();
  check('HTTP: an expired donation is not eligible', body.eligible === false);
  check('HTTP: an expired donation has no recommendations', body.recommendations?.length === 0);

  res = await get('/api/donations', ngoA.body.token);
  body = await res.json();
  check('HTTP: an expired donation disappears from the NGO feed', !body.donations?.some((d) => d.id === donationId));

  // --- cancel ------------------------------------------------------------
  await prisma.donation.update({ where: { id: donationId }, data: { expiryTime: new Date(Date.now() + 6 * HOUR) } });
  res = await fetch(`${base}/api/donations/${donationId}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${donorToken}` },
  });
  body = await res.json();
  check('HTTP: the donor can withdraw a donation', res.status === 200 && body.donation?.status === 'CANCELLED');

  res = await fetch(`${base}/api/donations/${donationId}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ngoA.body.token}` },
  });
  check('HTTP: an NGO cannot withdraw it -> 403', res.status === 403, `status ${res.status}`);

  console.log('');
}

async function main() {
  unitTests();

  const server = await listen(realApp);
  try {
    await httpTests(server);
  } finally {
    server.close();
  }

  const removed = await prisma.user.deleteMany({ where: { email: { startsWith: 'smoke.matching.' } } });
  console.log(`Cleaned up ${removed.count} smoke-test account(s) (donations and matches cascade).`);

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);

  await prisma.$disconnect();
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error('\nMatching smoke test crashed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
