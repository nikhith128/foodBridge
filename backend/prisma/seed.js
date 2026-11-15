/**
 * FoodBridge AI — database seed
 *
 * EVERYTHING HERE IS DEMO / SAMPLE DATA.
 * No real organisations, people, addresses or statistics are represented.
 * - Emails use the reserved `.test` domain so they can never reach a real inbox.
 * - Organisation names are suffixed with "(Demo)".
 * - Coordinates are fictional placeholder points inside one city, used only so
 *   that the distance calculation has something to measure between.
 *
 * Run with:  npm run seed     (or  npx prisma db seed )
 */

const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');

// Shared demo password for every seeded account. Printed at the end.
const DEMO_PASSWORD = 'Password123';

// Roughly the centre of the demo city area. Placeholder only, not a real address.
const DEMO_ORIGIN = { lat: 17.385044, lng: 78.486671 };

// Helper: a Date `hours` from now (negative = in the past).
function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function main() {
  console.log('Seeding FoodBridge AI demo data...\n');

  // --- Clean slate -------------------------------------------------------
  // Delete in dependency order so foreign keys never block us.
  // This makes the seed safe to run repeatedly.
  await prisma.pickup.deleteMany();
  await prisma.match.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.ngo.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- 1 demo donor ------------------------------------------------------
  const donor = await prisma.user.create({
    data: {
      name: 'Green Leaf Restaurant (Demo)',
      email: 'donor@foodbridge.test',
      password: passwordHash,
      role: 'DONOR',
      phone: '+91 90000 00001',
      organizationName: 'Green Leaf Restaurant (Demo)',
      donorType: 'Restaurant / Bistro',
    },
  });

  // --- 3 pre-approved NGOs ----------------------------------------------
  const ngoSeeds = [
    {
      name: 'Hope Foundation (Demo)',
      email: 'hope@foodbridge.test',
      phone: '+91 90000 00002',
      organisationName: 'Hope Foundation (Demo)',
      address: 'Demo address 1, Community Block, Demo City',
      latitude: DEMO_ORIGIN.lat + 0.012,
      longitude: DEMO_ORIGIN.lng + 0.008,
      storageCapacity: 120,
      foodPreference: 'Cooked Hot Meals, Fresh Produce, Bakery & Bread, Packaged Goods',
    },
    {
      name: 'Annapurna Trust (Demo)',
      email: 'annapurna@foodbridge.test',
      phone: '+91 90000 00003',
      organisationName: 'Annapurna Trust (Demo)',
      address: 'Demo address 2, Riverside Road, Demo City',
      latitude: DEMO_ORIGIN.lat - 0.02,
      longitude: DEMO_ORIGIN.lng + 0.015,
      storageCapacity: 80,
      // A vegetarian-only kitchen. The matching engine must never offer it
      // non-vegetarian food, whatever the rest of the score says.
      foodPreference: 'Vegetarian Only',
    },
    {
      name: 'Akshaya Seva Kitchen (Demo)',
      email: 'akshaya@foodbridge.test',
      phone: '+91 90000 00004',
      organisationName: 'Akshaya Seva Kitchen (Demo)',
      address: 'Demo address 3, Old Market Lane, Demo City',
      latitude: DEMO_ORIGIN.lat + 0.03,
      longitude: DEMO_ORIGIN.lng - 0.025,
      storageCapacity: 200,
      foodPreference: 'Cooked Hot Meals, Fresh Produce, Packaged Goods',
    },
  ];

  const ngos = [];
  for (const seed of ngoSeeds) {
    const user = await prisma.user.create({
      data: {
        name: seed.name,
        email: seed.email,
        password: passwordHash,
        role: 'NGO',
        phone: seed.phone,
      },
    });

    const ngo = await prisma.ngo.create({
      data: {
        userId: user.id,
        organizationName: seed.organisationName,
        address: seed.address,
        latitude: seed.latitude,
        longitude: seed.longitude,
        storageCapacity: seed.storageCapacity,
        foodPreference: seed.foodPreference,
        isAccepting: true,
        // MVP: NGOs are pre-approved instead of going through verification.
        verificationStatus: 'VERIFIED',
      },
    });

    ngos.push(ngo);
  }

  // --- 1 demo volunteer --------------------------------------------------
  // Exists so all three roles can prove "logs in and lands on the correct
  // dashboard". The volunteer module itself (OTP pickup) is deferred.
  const volunteer = await prisma.user.create({
    data: {
      name: 'Ravi Kumar (Demo)',
      email: 'volunteer@foodbridge.test',
      password: passwordHash,
      role: 'VOLUNTEER',
      phone: '+91 90000 00005',
      city: 'Demo City',
      availability: 'Weekdays, Evenings',
      hasVehicle: true,
    },
  });

  // --- 8 sample donations -----------------------------------------------
  // One for each state the donor dashboard can show, so every badge, counter
  // and action has something real to render. `pickup` and `match` describe the
  // downstream records each claimed donation needs; an AVAILABLE batch has
  // neither, and the matching engine creates its Match rows on demand.
  const donationSeeds = [
    {
      foodName: 'Hyderabadi Dum Biryani (Demo)',
      foodCategory: 'Cooked Hot Meals',
      foodType: 'NON_VEG',
      quantity: 12,
      preparationTime: hoursFromNow(-3),
      storageCondition: 'Held hot in insulated containers',
      expiryTime: hoursFromNow(6),
      description: 'Surplus from a demo lunch service. Packed in sealed trays.',
      status: 'AVAILABLE',
    },
    {
      foodName: 'Veg Salad & Sandwich Platter (Demo)',
      foodCategory: 'Cooked Hot Meals',
      foodType: 'VEG',
      quantity: 8,
      preparationTime: hoursFromNow(-2),
      storageCondition: 'Refrigerated at 4 C',
      expiryTime: hoursFromNow(10),
      description: 'Cold platters prepared for a demo event that over-catered.',
      status: 'AVAILABLE',
    },
    {
      foodName: 'Assorted Bread & Buns (Demo)',
      foodCategory: 'Bakery & Bread',
      foodType: 'VEG',
      quantity: 15,
      preparationTime: hoursFromNow(-5),
      storageCondition: 'Room temperature, paper-wrapped',
      expiryTime: hoursFromNow(20),
      description: 'Unsold demo bakery stock from this morning.',
      status: 'AVAILABLE',
    },
    {
      foodName: 'Cooked Rice & Dal (Demo)',
      foodCategory: 'Cooked Hot Meals',
      foodType: 'VEG',
      quantity: 25,
      preparationTime: hoursFromNow(-1),
      storageCondition: 'Held warm in food-grade containers',
      expiryTime: hoursFromNow(3),
      description: 'Demo canteen surplus. Already claimed by an NGO.',
      status: 'ACCEPTED',
      ngoIndex: 0,
      match: { score: 91.4, distance: 1.58, explanation: 'Claimed by Hope Foundation (Demo) for its evening outreach.' },
    },
    {
      foodName: 'Fresh Paneer Wraps (Demo)',
      foodCategory: 'Cooked Hot Meals',
      foodType: 'VEG',
      quantity: 6,
      preparationTime: hoursFromNow(-1),
      storageCondition: 'Refrigerated below 4 C',
      expiryTime: hoursFromNow(4),
      description: 'Demo cafe surplus. A volunteer has been assigned to collect it.',
      status: 'ASSIGNED',
      ngoIndex: 0,
      volunteer: true,
      match: { score: 88.2, distance: 1.58, explanation: 'Claimed by Hope Foundation (Demo); a volunteer is assigned.' },
    },
    {
      foodName: 'Mixed Veg Curry & Rice (Demo)',
      foodCategory: 'Cooked Hot Meals',
      foodType: 'VEG',
      quantity: 18,
      preparationTime: hoursFromNow(-2),
      storageCondition: 'Hot holding above 60 C',
      expiryTime: hoursFromNow(5),
      description: 'Demo hotel surplus, collected and on its way to the NGO.',
      status: 'PICKED_UP',
      ngoIndex: 1,
      volunteer: true,
      pickupStatus: 'PICKED_UP',
      match: { score: 84.7, distance: 2.73, explanation: 'Claimed by Annapurna Trust (Demo); collection in progress.' },
    },
    {
      foodName: 'Bakery Surplus Box (Demo)',
      foodCategory: 'Bakery & Bread',
      foodType: 'VEG',
      quantity: 20,
      preparationTime: hoursFromNow(-26),
      storageCondition: 'Ambient, sealed crates',
      expiryTime: hoursFromNow(-20),
      description: 'Delivered to the NGO and recorded as completed.',
      status: 'COMPLETED',
      ngoIndex: 0,
      volunteer: true,
      pickupStatus: 'COMPLETED',
      pickupTime: hoursFromNow(-24),
      deliveryTime: hoursFromNow(-19),
      match: { score: 93.1, distance: 1.58, explanation: 'Delivered to Hope Foundation (Demo) and verified.' },
    },
    {
      foodName: 'Assorted Fruit Boxes (Demo)',
      foodCategory: 'Fresh Produce',
      foodType: 'VEG',
      quantity: 10,
      preparationTime: hoursFromNow(-30),
      storageCondition: 'Refrigerated at 6 C',
      expiryTime: hoursFromNow(-2),
      description: 'Past its demo collection deadline, kept to show the EXPIRED state.',
      status: 'EXPIRED',
    },
  ];

  const donations = [];
  for (const seed of donationSeeds) {
    const donation = await prisma.donation.create({
      data: {
        donorId: donor.id,
        foodName: seed.foodName,
        foodCategory: seed.foodCategory,
        foodType: seed.foodType,
        quantity: seed.quantity,
        quantityUnit: 'kg',
        preparationTime: seed.preparationTime,
        storageCondition: seed.storageCondition,
        expiryTime: seed.expiryTime,
        // Pickup point sits at the demo origin with a small offset.
        latitude: DEMO_ORIGIN.lat,
        longitude: DEMO_ORIGIN.lng,
        description: seed.description,
        status: seed.status,
      },
    });

    // A claimed donation carries the Match row its NGO accepted and the Pickup
    // record that tracks collection. AVAILABLE and EXPIRED batches have neither.
    if (typeof seed.ngoIndex === 'number') {
      const ngo = ngos[seed.ngoIndex];

      await prisma.match.create({
        data: {
          donationId: donation.id,
          ngoId: ngo.id,
          compatibilityScore: seed.match.score,
          distance: seed.match.distance,
          explanation: seed.match.explanation,
          status: 'ACCEPTED',
        },
      });

      await prisma.pickup.create({
        data: {
          donationId: donation.id,
          ngoId: ngo.id,
          volunteerId: seed.volunteer ? volunteer.id : null,
          pickupTime: seed.pickupTime ?? null,
          deliveryTime: seed.deliveryTime ?? null,
          status: seed.pickupStatus || 'PENDING',
        },
      });
    }

    donations.push(donation);
  }

  // --- Summary -----------------------------------------------------------
  const byStatus = donations.reduce((counts, donation) => {
    counts[donation.status] = (counts[donation.status] || 0) + 1;
    return counts;
  }, {});
  const statusLine = Object.entries(byStatus)
    .map(([status, count]) => `${count} ${status}`)
    .join(', ');

  console.log('Seeded:');
  console.log(`  Users:     1 donor + 3 NGO + 1 volunteer = 5`);
  console.log(`  NGOs:      ${ngos.length} (all VERIFIED, accepting)`);
  console.log(`  Donations: ${donations.length} (${statusLine})`);
  console.log('');
  console.log('Login with any of these (all use the same demo password):');
  console.log('  donor@foodbridge.test        -> DONOR');
  console.log('  hope@foodbridge.test         -> NGO');
  console.log('  annapurna@foodbridge.test    -> NGO');
  console.log('  akshaya@foodbridge.test      -> NGO');
  console.log('  volunteer@foodbridge.test    -> VOLUNTEER');
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log('');
  console.log('All of the above is SAMPLE DATA for demonstration only.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
