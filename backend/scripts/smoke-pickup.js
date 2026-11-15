/**
 * NGO + pickup smoke test for Step D.
 *
 * One end-to-end run over real HTTP against the real app and the real database:
 * a donor publishes a donation, two NGOs are recommended, one accepts it, and
 * the pickup is walked from PENDING to COMPLETED. The checks that matter are the
 * refusals — a second NGO must not be able to take the same batch, and the
 * pickup must not skip a step.
 *
 * Run:  node scripts/smoke-pickup.js
 * Creates a few `smoke.pickup.*@foodbridge.test` rows and deletes them again.
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
    foodName: 'Pickup Smoke Biryani',
    foodCategory: 'Cooked Hot Meals',
    foodType: 'NON_VEG',
    quantity: 20,
    quantityUnit: 'kg',
    preparationTime: new Date(Date.now() - 2 * HOUR).toISOString(),
    storageCondition: 'Hot holding above 60 C',
    expiryTime: new Date(Date.now() + 6 * HOUR).toISOString(),
    latitude: 17.385044,
    longitude: 78.486671,
    description: 'Pickup smoke test donation.',
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
    name: 'Smoke Pickup Donor',
    email: `smoke.pickup.donor.${stamp}@foodbridge.test`,
    password: PASSWORD,
    role: 'DONOR',
    organizationName: 'Smoke Pickup Kitchen (Demo)',
    donorType: 'Restaurant / Bistro',
  });
  const ngoA = await register({
    name: 'Smoke Pickup NGO A',
    email: `smoke.pickup.ngoa.${stamp}@foodbridge.test`,
    password: PASSWORD,
    role: 'NGO',
    organizationName: 'Smoke Alpha Kitchen (Demo)',
    address: '1 Alpha Road, Demo City',
    storageCapacity: 150,
    foodPreference: ['Cooked Hot Meals', 'Fresh Produce'],
  });
  const ngoB = await register({
    name: 'Smoke Pickup NGO B',
    email: `smoke.pickup.ngob.${stamp}@foodbridge.test`,
    password: PASSWORD,
    role: 'NGO',
    organizationName: 'Smoke Beta Kitchen (Demo)',
    address: '2 Beta Road, Demo City',
    storageCapacity: 60,
    foodPreference: ['Cooked Hot Meals'],
  });

  check(
    'setup: donor and two NGOs registered',
    donor.res.status === 201 && ngoA.res.status === 201 && ngoB.res.status === 201
  );

  const donorToken = donor.body.token;
  const tokenA = ngoA.body.token;
  const tokenB = ngoB.body.token;
  const ngoAId = ngoA.body.user.ngo.id;
  const ngoBId = ngoB.body.user.ngo.id;

  // A freshly registered NGO is PENDING, so approve and locate them directly.
  await prisma.ngo.update({
    where: { id: ngoAId },
    data: { verificationStatus: 'VERIFIED', latitude: 17.397044, longitude: 78.494671 },
  });
  await prisma.ngo.update({
    where: { id: ngoBId },
    data: { verificationStatus: 'VERIFIED', latitude: 17.42, longitude: 78.52 },
  });

  // Helper: publish a donation and read its matches so match rows exist.
  const publishWithMatches = async (overrides = {}) => {
    const created = await post('/api/donations', donationBody(overrides), donorToken);
    const createdBody = await created.json();
    const id = createdBody.donation.id;
    const matchesRes = await get(`/api/matches/${id}`, donorToken);
    const matchesBody = await matchesRes.json();
    const matchIdFor = (ngoId) =>
      (matchesBody.recommendations || []).find((r) => r.ngo.id === ngoId)?.matchId ?? null;
    return { id, matchesBody, matchIdA: matchIdFor(ngoAId), matchIdB: matchIdFor(ngoBId) };
  };

  // ================================================== 1. accept happy path
  console.log('\n--- accept ---\n');
  const d1 = await publishWithMatches({ foodName: 'HTTP Pickup Biryani' });
  check('matches: both NGOs were recommended', Boolean(d1.matchIdA) && Boolean(d1.matchIdB), `A=${d1.matchIdA} B=${d1.matchIdB}`);

  let res = await get('/api/donations', tokenA);
  let body = await res.json();
  const listed = (body.donations || []).find((x) => x.id === d1.id);
  check('NGO feed: the new donation is listed', Boolean(listed));
  check('NGO feed: each batch carries a forYou score', typeof listed?.forYou?.score === 'number', `${listed?.forYou?.score}`);
  check('NGO feed: the batch is eligible for this NGO', listed?.forYou?.eligible === true);
  check('NGO feed: forYou carries a distance in km', typeof listed?.forYou?.distanceKm === 'number', `${listed?.forYou?.distanceKm}`);

  res = await post(`/api/matches/${d1.matchIdA}/accept`, null, donorToken);
  check('accept: a donor cannot accept -> 403', res.status === 403, `status ${res.status}`);

  res = await post(`/api/matches/${d1.matchIdA}/accept`, null, tokenA);
  body = await res.json();
  check('accept: the recommended NGO accepts -> 200', res.status === 200, `status ${res.status}`);
  check('accept: the donation is now ACCEPTED', body.donation?.status === 'ACCEPTED');
  check('accept: a PENDING pickup was opened', body.pickup?.status === 'PENDING' && Number.isInteger(body.pickup?.id));
  check('accept: the match is recorded as ACCEPTED', body.match?.status === 'ACCEPTED');
  check('accept: the response names the recipient NGO', body.donation?.matchedNgo?.id === ngoAId);
  const pickupId = body.pickup.id;

  res = await post(`/api/matches/${d1.matchIdA}/accept`, null, tokenA);
  body = await res.json();
  check('accept: the same NGO cannot accept twice -> 409', res.status === 409, `status ${res.status}`);
  check('accept: the second attempt explains why', /already accepted/i.test(body.message || ''), body.message);

  res = await post(`/api/matches/${d1.matchIdB}/accept`, null, tokenB);
  body = await res.json();
  check('accept: the rival NGO is refused -> 409', res.status === 409, `status ${res.status}`);
  check('accept: the rival is told the batch is gone', /no longer open|already been claimed/i.test(body.message || ''), body.message);

  res = await post(`/api/matches/${d1.matchIdA}/accept`, null, tokenB);
  check("accept: another NGO cannot use a foreign matchId -> 404", res.status === 404, `status ${res.status}`);

  res = await get(`/api/donations/${d1.id}`, tokenA);
  body = await res.json();
  check('donation detail: the owner NGO sees its ACCEPTED match', body.donation?.myMatch?.status === 'ACCEPTED');
  check('donation detail: the owner NGO sees its PENDING pickup', body.donation?.myPickup?.status === 'PENDING');

  res = await get(`/api/donations/${d1.id}`, donorToken);
  body = await res.json();
  check('donation detail: the donor sees the accepted status', body.donation?.status === 'ACCEPTED');
  check('donation detail: the donor sees which NGO took it', body.donation?.matchedNgo?.organizationName === 'Smoke Alpha Kitchen (Demo)');

  res = await get('/api/donations', tokenB);
  body = await res.json();
  check('NGO feed: a claimed batch leaves the available list', !(body.donations || []).some((x) => x.id === d1.id));

  res = await get(`/api/matches/${d1.id}`, donorToken);
  body = await res.json();
  check('matches: a claimed donation is no longer eligible', body.eligible === false);
  check('matches: the reason names the claim', body.reasons?.some((r) => /claimed/i.test(r)));

  // ================================================== 2. pickup lifecycle
  console.log('\n--- pickup ---\n');
  res = await get('/api/pickups', tokenA);
  body = await res.json();
  check('pickups: the owner NGO lists one pickup', body.count === 1 && body.pickups?.[0]?.id === pickupId);
  check('pickups: the pickup carries the donation', body.pickups?.[0]?.donation?.id === d1.id);
  check(
    'pickups: the pickup carries the donor',
    body.pickups?.[0]?.donation?.donor?.organizationName === 'Smoke Pickup Kitchen (Demo)'
  );

  res = await get('/api/pickups', tokenB);
  body = await res.json();
  check('pickups: a rival NGO sees nothing', body.count === 0);

  res = await get('/api/pickups', donorToken);
  check('pickups: a donor cannot list pickups -> 403', res.status === 403, `status ${res.status}`);

  res = await patch(`/api/pickups/${pickupId}/status`, { status: 'PICKED_UP' }, tokenB);
  check("pickup: another NGO cannot touch a foreign pickup -> 404", res.status === 404, `status ${res.status}`);

  res = await patch(`/api/pickups/${pickupId}/status`, {}, tokenA);
  check('pickup: a missing status -> 400', res.status === 400, `status ${res.status}`);

  res = await patch(`/api/pickups/${pickupId}/status`, { status: 'COMPLETED' }, tokenA);
  body = await res.json();
  check('pickup: skipping PICKED_UP -> 409', res.status === 409, `status ${res.status}`);
  check('pickup: the refusal names the only legal step', /PICKED_UP/.test(body.message || ''), body.message);

  res = await patch(`/api/pickups/${pickupId}/status`, { status: 'PICKED_UP' }, tokenA);
  body = await res.json();
  check('pickup: PENDING -> PICKED_UP -> 200', res.status === 200, `status ${res.status}`);
  check('pickup: the pickup records a pickup time', Boolean(body.pickup?.pickupTime));
  check('pickup: the donation follows to PICKED_UP', body.pickup?.donation?.status === 'PICKED_UP');

  res = await patch(`/api/pickups/${pickupId}/status`, { status: 'PICKED_UP' }, tokenA);
  check('pickup: a second PICKED_UP -> 409', res.status === 409, `status ${res.status}`);

  res = await patch(`/api/pickups/${pickupId}/status`, { status: 'COMPLETED' }, tokenA);
  body = await res.json();
  check('pickup: PICKED_UP -> COMPLETED -> 200', res.status === 200, `status ${res.status}`);
  check('pickup: the pickup records a delivery time', Boolean(body.pickup?.deliveryTime));
  check('pickup: the donation follows to COMPLETED', body.pickup?.donation?.status === 'COMPLETED');

  res = await patch(`/api/pickups/${pickupId}/status`, { status: 'COMPLETED' }, tokenA);
  check('pickup: a completed pickup cannot move again -> 409', res.status === 409, `status ${res.status}`);

  res = await get('/api/pickups?status=COMPLETED', tokenA);
  body = await res.json();
  check('pickups: the status filter narrows the list', body.count === 1);

  res = await patch('/api/pickups/999999/status', { status: 'PICKED_UP' }, tokenA);
  check('pickup: an unknown id -> 404', res.status === 404, `status ${res.status}`);

  res = await get(`/api/donations/${d1.id}`, donorToken);
  body = await res.json();
  check('donation detail: the donor sees the completed status', body.donation?.status === 'COMPLETED');

  // ================================================== 3. refusals
  console.log('\n--- refusals ---\n');

  // 3a. A deadline that passes after the recommendation was computed.
  const d2 = await publishWithMatches({
    foodName: 'HTTP Pickup Expired',
    expiryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });
  await prisma.donation.update({
    where: { id: d2.id },
    data: { expiryTime: new Date(Date.now() - HOUR) },
  });
  res = await post(`/api/matches/${d2.matchIdA}/accept`, null, tokenA);
  body = await res.json();
  check('refusal: an expired donation cannot be accepted -> 409', res.status === 409, `status ${res.status}`);
  check('refusal: the reason is the deadline', /deadline has passed/i.test(body.message || ''), body.message);

  // 3b. A withdrawn donation.
  const d3 = await publishWithMatches({ foodName: 'HTTP Pickup Withdrawn' });
  await patch(`/api/donations/${d3.id}/cancel`, null, donorToken);
  res = await post(`/api/matches/${d3.matchIdA}/accept`, null, tokenA);
  body = await res.json();
  check('refusal: a withdrawn donation cannot be accepted -> 409', res.status === 409, `status ${res.status}`);
  check('refusal: the reason names the withdrawal', /withdrawn/i.test(body.message || ''), body.message);

  // 3c. An NGO that has stopped accepting.
  const d4 = await publishWithMatches({ foodName: 'HTTP Pickup NotAccepting' });
  await prisma.ngo.update({ where: { id: ngoBId }, data: { isAccepting: false } });
  res = await post(`/api/matches/${d4.matchIdB}/accept`, null, tokenB);
  body = await res.json();
  check('refusal: an NGO that is not accepting is refused -> 409', res.status === 409, `status ${res.status}`);
  check('refusal: the reason names the intake status', /not currently accepting/i.test(body.message || ''), body.message);
  await prisma.ngo.update({ where: { id: ngoBId }, data: { isAccepting: true } });

  // 3d. A volunteer has no place in the pickup flow yet.
  const volunteer = await register({
    name: 'Smoke Pickup Volunteer',
    email: `smoke.pickup.volunteer.${stamp}@foodbridge.test`,
    password: PASSWORD,
    role: 'VOLUNTEER',
    availability: 'Weekends',
  });
  res = await post(`/api/matches/${d1.matchIdA}/accept`, null, volunteer.body.token);
  check('refusal: a volunteer cannot accept -> 403', res.status === 403, `status ${res.status}`);
  res = await get('/api/pickups', volunteer.body.token);
  check('refusal: a volunteer cannot list pickups -> 403', res.status === 403, `status ${res.status}`);

  // ================================================== 4. claim without a donor read
  console.log('\n--- direct claim ---\n');
  const direct = await post('/api/donations', donationBody({ foodName: 'HTTP Pickup Direct' }), donorToken);
  const directBody = await direct.json();
  const directId = directBody.donation.id;

  const preCount = await prisma.match.count({ where: { donationId: directId } });
  check('direct: no match rows exist before an NGO looks', preCount === 0, `${preCount}`);

  res = await get(`/api/donations/${directId}`, tokenA);
  body = await res.json();
  check('direct: viewing the batch records a match for the NGO', Number.isInteger(body.donation?.myMatch?.id));
  check('direct: the recorded match is PENDING', body.donation?.myMatch?.status === 'PENDING');
  check('direct: the feed then exposes the matchId', typeof body.donation?.forYou?.matchId === 'number');
  const directMatchId = body.donation.myMatch.id;

  res = await post(`/api/matches/${directMatchId}/accept`, null, tokenA);
  body = await res.json();
  check('direct: the NGO accepts from its own detail view -> 200', res.status === 200, `status ${res.status}`);
  check('direct: the donation is ACCEPTED', body.donation?.status === 'ACCEPTED');

  server.close();

  const removed = await prisma.user.deleteMany({ where: { email: { startsWith: 'smoke.pickup.' } } });
  console.log(`\nCleaned up ${removed.count} smoke-test account(s) (donations, matches and pickups cascade).`);

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);

  await prisma.$disconnect();
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error('\nPickup smoke test crashed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
