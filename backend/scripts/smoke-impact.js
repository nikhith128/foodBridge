/**
 * Impact smoke test for Step E.
 *
 * The Step E "done when" is one sentence: completing a donation changes the
 * Impact numbers. So this run takes a baseline, drives a donation all the way
 * from published to COMPLETED, and checks that the counters, the time series and
 * the recent table all moved — and that nothing moves before the donation is
 * actually complete.
 *
 * Run:  node scripts/smoke-impact.js
 * Creates a few `smoke.impact.*@foodbridge.test` rows and deletes them again.
 *
 * NOTE: run this on its own, never in parallel with another smoke suite — they
 * share one MySQL instance.
 */

const realApp = require('../src/app');
const prisma = require('../src/config/prisma');

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

function donationBody(overrides = {}) {
  return {
    foodName: 'Impact Smoke Biryani',
    foodCategory: 'Cooked Hot Meals',
    foodType: 'VEG',
    quantity: 20,
    quantityUnit: 'kg',
    preparationTime: new Date(Date.now() - 2 * HOUR).toISOString(),
    storageCondition: 'Hot holding above 60 C',
    expiryTime: new Date(Date.now() + 6 * HOUR).toISOString(),
    latitude: 17.385044,
    longitude: 78.486671,
    description: 'Impact smoke test donation.',
    ...overrides,
  };
}

async function main() {
  const server = await listen(realApp);
  const base = `http://localhost:${server.address().port}`;
  const stamp = Date.now();
  const PASSWORD = 'Password123';

  const request = (method) => (path, body, token) =>
    fetch(`${base}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

  const post = request('POST');
  const patch = request('PATCH');
  const get = (path, token) =>
    fetch(`${base}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

  const register = async (payload) => {
    const res = await post('/api/auth/register', payload);
    return { res, body: await res.json() };
  };

  const donor = await register({
    name: 'Smoke Impact Donor',
    email: `smoke.impact.donor.${stamp}@foodbridge.test`,
    password: PASSWORD,
    role: 'DONOR',
    organizationName: 'Smoke Impact Kitchen (Demo)',
    donorType: 'Restaurant / Bistro',
  });
  const ngo = await register({
    name: 'Smoke Impact NGO',
    email: `smoke.impact.ngo.${stamp}@foodbridge.test`,
    password: PASSWORD,
    role: 'NGO',
    organizationName: 'Smoke Impact Kitchen NGO (Demo)',
    address: '3 Gamma Road, Demo City',
    storageCapacity: 200,
    foodPreference: ['Cooked Hot Meals'],
  });
  const volunteer = await register({
    name: 'Smoke Impact Volunteer',
    email: `smoke.impact.volunteer.${stamp}@foodbridge.test`,
    password: PASSWORD,
    role: 'VOLUNTEER',
    availability: 'Weekends',
  });

  check(
    'setup: donor, NGO and volunteer registered',
    donor.res.status === 201 && ngo.res.status === 201 && volunteer.res.status === 201
  );

  const donorToken = donor.body.token;
  const ngoToken = ngo.body.token;
  const volunteerToken = volunteer.body.token;
  const ngoId = ngo.body.user.ngo.id;
  const volunteerId = volunteer.body.user.id;

  await prisma.ngo.update({
    where: { id: ngoId },
    data: { verificationStatus: 'VERIFIED', latitude: 17.397044, longitude: 78.494671 },
  });

  // ================================================== 1. baseline
  console.log('\n--- baseline ---\n');
  let res = await get('/api/impact', donorToken);
  let body = await res.json();
  check('impact: a donor gets 200', res.status === 200, `status ${res.status}`);
  check('impact: the scope is the donor', body.scope === 'DONOR');
  check('impact: the response is labelled sample data', body.sampleData === true);
  check('impact: the default range is all time', body.range === 'all');
  check(
    'impact: the summary carries every Step E counter',
    ['completedDonations', 'mealsRescued', 'kgRescued', 'activeDonations', 'completedPickups', 'participatingOrganisations'].every(
      (key) => typeof body.summary?.[key] === 'number'
    )
  );
  check('impact: a fresh donor has completed nothing', body.summary.completedDonations === 0, `${body.summary.completedDonations}`);
  check('impact: a fresh donor has rescued no meals', body.summary.mealsRescued === 0);
  check('impact: the time series is an array', Array.isArray(body.mealsOverTime) && body.mealsOverTime.length > 0);
  check('impact: the status donut is empty', Array.isArray(body.donationsByStatus) && body.donationsByStatus.length === 0);
  check('impact: the category bars are empty', Array.isArray(body.donationsByCategory) && body.donationsByCategory.length === 0);
  check('impact: there are no contributors yet', Array.isArray(body.topContributors) && body.topContributors.length === 0);
  check('impact: the recent table is empty', Array.isArray(body.recentCompleted) && body.recentCompleted.length === 0);
  check('impact: a donor has no volunteer block', body.volunteer === null);

  // ================================================== 2. publish + accept
  console.log('\n--- publish, accept, collect ---\n');
  const created = await post('/api/donations', donationBody(), donorToken);
  const createdBody = await created.json();
  const donationId = createdBody.donation.id;

  const matchesRes = await get(`/api/matches/${donationId}`, donorToken);
  const matchesBody = await matchesRes.json();
  const matchId = (matchesBody.recommendations || []).find((r) => r.ngo.id === ngoId)?.matchId;
  check('flow: the NGO was recommended the batch', Boolean(matchId), `matchId ${matchId}`);

  res = await get('/api/impact', donorToken);
  body = await res.json();
  check('impact: an open batch is not yet a completed donation', body.summary.completedDonations === 0);
  check('impact: an open batch counts as active', body.summary.activeDonations === 1, `${body.summary.activeDonations}`);
  check(
    'impact: an open batch appears in the status donut',
    body.donationsByStatus.some((row) => row.status === 'AVAILABLE' && row.count === 1)
  );
  check(
    'impact: an open batch appears in the category bars',
    body.donationsByCategory.some((row) => row.category === 'Cooked Hot Meals' && row.count === 1)
  );
  check('impact: an open batch still contributes no meals', body.summary.mealsRescued === 0);

  res = await post(`/api/matches/${matchId}/accept`, null, ngoToken);
  body = await res.json();
  check('flow: the NGO accepts -> 200', res.status === 200, `status ${res.status}`);
  const pickupId = body.pickup.id;

  res = await get('/api/impact', donorToken);
  body = await res.json();
  check('impact: an accepted batch is still not completed', body.summary.completedDonations === 0);

  await patch(`/api/pickups/${pickupId}/status`, { status: 'PICKED_UP' }, ngoToken);
  res = await get('/api/impact', donorToken);
  body = await res.json();
  check('impact: a collected batch is still not completed', body.summary.completedDonations === 0);
  check('impact: a collected batch contributes no meals', body.summary.mealsRescued === 0);

  // ================================================== 3. completing changes it
  console.log('\n--- completed ---\n');
  res = await patch(`/api/pickups/${pickupId}/status`, { status: 'COMPLETED' }, ngoToken);
  check('flow: the pickup completes -> 200', res.status === 200, `status ${res.status}`);

  res = await get('/api/impact', donorToken);
  body = await res.json();
  check('impact: completing the donation moves the completed counter', body.summary.completedDonations === 1, `${body.summary.completedDonations}`);
  check('impact: 20 kg becomes 50 meals at 2.5 per kg', body.summary.mealsRescued === 50, `${body.summary.mealsRescued}`);
  check('impact: the kilogram figure is reported', body.summary.kgRescued === 20, `${body.summary.kgRescued}`);
  check('impact: the completed pickup is counted', body.summary.completedPickups === 1);
  check(
    'impact: the donor and the NGO are both participating organisations',
    body.summary.participatingOrganisations === 2,
    `${body.summary.participatingOrganisations}`
  );
  check('impact: the completed batch is no longer active', body.summary.activeDonations === 0);
  check(
    'impact: the status donut now shows COMPLETED',
    body.donationsByStatus.some((row) => row.status === 'COMPLETED' && row.count === 1)
  );
  check(
    'impact: today carries the rescued meals',
    body.mealsOverTime[body.mealsOverTime.length - 1].meals === 50,
    `${body.mealsOverTime[body.mealsOverTime.length - 1].meals}`
  );
  check(
    'impact: today counts one donation',
    body.mealsOverTime[body.mealsOverTime.length - 1].donations === 1
  );
  check('impact: the donor is a top contributor', body.topContributors[0]?.meals === 50, `${body.topContributors[0]?.meals}`);
  check('impact: the contributor names the facility', body.topContributors[0]?.name === 'Smoke Impact Kitchen (Demo)');
  check('impact: the recent table lists the rescue', body.recentCompleted[0]?.id === donationId);
  check('impact: the recent row carries the meals', body.recentCompleted[0]?.meals === 50);
  check('impact: the recent row names the receiving NGO', body.recentCompleted[0]?.ngo?.organizationName === 'Smoke Impact Kitchen NGO (Demo)');
  check('impact: the recent row is timestamped', Boolean(body.recentCompleted[0]?.completedAt));

  // ================================================== 4. role scoping
  console.log('\n--- role scoping ---\n');
  res = await get('/api/impact', ngoToken);
  body = await res.json();
  check('impact: the NGO scope is reported', body.scope === 'NGO');
  check('impact: the receiving NGO counts the rescue', body.summary.completedDonations === 1);
  check('impact: the receiving NGO counts the meals', body.summary.mealsRescued === 50);

  const otherNgo = await register({
    name: 'Smoke Impact Other NGO',
    email: `smoke.impact.other.${stamp}@foodbridge.test`,
    password: PASSWORD,
    role: 'NGO',
    organizationName: 'Smoke Impact Other NGO (Demo)',
    address: '4 Delta Road, Demo City',
    storageCapacity: 200,
    foodPreference: ['Cooked Hot Meals'],
  });
  res = await get('/api/impact', otherNgo.body.token);
  body = await res.json();
  check('impact: an uninvolved NGO sees nothing', body.summary.completedDonations === 0);
  check('impact: an uninvolved NGO has no contributors', body.topContributors.length === 0);

  res = await get('/api/impact', volunteerToken);
  body = await res.json();
  check('impact: the volunteer scope is reported', body.scope === 'VOLUNTEER');
  check('impact: a volunteer who collected nothing sees no completions', body.summary.completedDonations === 0);
  check('impact: the volunteer block is present', body.volunteer !== null);
  check('impact: the volunteer distance is a number', typeof body.volunteer?.distanceKm === 'number');
  check('impact: the volunteer has no top contributors', body.topContributors.length === 0);
  check('impact: the volunteer badges are an array', Array.isArray(body.volunteer?.badges));
  check('impact: no badge is awarded for zero rescues', body.volunteer.badges.length === 0);

  // The volunteer who actually carries the food sees it, once the pickup names them.
  await prisma.pickup.update({ where: { id: pickupId }, data: { volunteerId } });
  res = await get('/api/impact', volunteerToken);
  body = await res.json();
  check('impact: a volunteer sees the rescue once the pickup names them', body.summary.completedDonations === 1);
  check('impact: the volunteer distance is derived, not zero', body.volunteer.distanceKm > 0, `${body.volunteer.distanceKm} km`);
  check('impact: the first rescue earns a badge', body.volunteer.badges.some((b) => b.key === 'first-rescue'));
  check(
    'impact: badges are not invented beyond the numbers',
    !body.volunteer.badges.some((b) => b.key === 'five-rescues' || b.key === 'hundred-meals')
  );

  // ================================================== 5. range filter
  console.log('\n--- range filter ---\n');
  res = await get('/api/impact?range=7d', donorToken);
  body = await res.json();
  check('range: 7d is honoured', body.range === '7d');
  check('range: a rescue completed today falls inside 7d', body.summary.completedDonations === 1);

  res = await get('/api/impact?range=30d', donorToken);
  body = await res.json();
  check('range: 30d is honoured', body.range === '30d');
  check('range: the time series is longer for 30d', body.mealsOverTime.length === 30, `${body.mealsOverTime.length}`);

  res = await get('/api/impact?range=7d', donorToken);
  body = await res.json();
  check('range: the time series is seven buckets for 7d', body.mealsOverTime.length === 7, `${body.mealsOverTime.length}`);

  res = await get('/api/impact?range=fortnight', donorToken);
  body = await res.json();
  check('range: an unknown range falls back to all time', body.range === 'all');

  // ================================================== 6. auth
  console.log('\n--- auth ---\n');
  res = await get('/api/impact');
  check('impact: an anonymous request -> 401', res.status === 401, `status ${res.status}`);

  server.close();

  const removed = await prisma.user.deleteMany({ where: { email: { startsWith: 'smoke.impact.' } } });
  console.log(`\nCleaned up ${removed.count} smoke-test account(s) (donations, matches and pickups cascade).`);

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);

  await prisma.$disconnect();
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error('\nImpact smoke test crashed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
