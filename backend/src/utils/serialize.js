/**
 * Response serializers shared by the donation, match and pickup controllers.
 *
 * The API never returns a raw Prisma row. DECIMAL columns arrive as strings and
 * timestamps as Date objects, so both are normalised here; every page then sees
 * exactly one shape per entity. Keeping this in one place means the donor's
 * "My Donations" and the NGO's "Available Donations" cannot drift apart.
 */

// --- Reusable Prisma `select` shapes --------------------------------------
const DONOR_SUMMARY = {
  select: { id: true, name: true, organizationName: true, donorType: true, phone: true },
};

const NGO_SUMMARY = {
  select: {
    id: true,
    organizationName: true,
    address: true,
    latitude: true,
    longitude: true,
    storageCapacity: true,
    verificationStatus: true,
  },
};

function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

function toNumber(value) {
  return value === null || value === undefined ? null : Number(value);
}

/**
 * A donation whose collection deadline has passed reads EXPIRED without a write.
 * `effectiveStatus` is what the UI shows; the stored `status` is left alone.
 */
function isDonationExpired(donation) {
  return Boolean(
    donation.status === 'AVAILABLE' &&
      donation.expiryTime &&
      new Date(donation.expiryTime).getTime() <= Date.now()
  );
}

/** The shape every donation response uses. */
function serializeDonation(donation) {
  const expired = isDonationExpired(donation);

  return {
    id: donation.id,
    donorId: donation.donorId,
    foodName: donation.foodName,
    foodCategory: donation.foodCategory,
    foodType: donation.foodType,
    quantity: toNumber(donation.quantity),
    quantityUnit: donation.quantityUnit,
    preparationTime: toIso(donation.preparationTime),
    storageCondition: donation.storageCondition,
    expiryTime: toIso(donation.expiryTime),
    latitude: toNumber(donation.latitude),
    longitude: toNumber(donation.longitude),
    description: donation.description,
    status: donation.status,
    /** What to show: `status`, but AVAILABLE past its deadline reads EXPIRED. */
    effectiveStatus: expired ? 'EXPIRED' : donation.status,
    isExpired: expired,
    createdAt: toIso(donation.createdAt),
    donor: donation.donor
      ? {
          id: donation.donor.id,
          name: donation.donor.name,
          organizationName: donation.donor.organizationName,
          donorType: donation.donor.donorType,
          phone: donation.donor.phone,
        }
      : undefined,
    matchedNgo: donation.pickup?.ngo
      ? {
          id: donation.pickup.ngo.id,
          organizationName: donation.pickup.ngo.organizationName,
          address: donation.pickup.ngo.address,
        }
      : undefined,
    matchCount: donation._count?.matches,
  };
}

/** The shape every pickup response uses. `donation` is a full donation. */
function serializePickup(pickup) {
  return {
    id: pickup.id,
    status: pickup.status,
    pickupTime: toIso(pickup.pickupTime),
    deliveryTime: toIso(pickup.deliveryTime),
    createdAt: toIso(pickup.createdAt),
    donation: pickup.donation ? serializeDonation(pickup.donation) : undefined,
    ngo: pickup.ngo
      ? {
          id: pickup.ngo.id,
          organizationName: pickup.ngo.organizationName,
          address: pickup.ngo.address,
          latitude: toNumber(pickup.ngo.latitude),
          longitude: toNumber(pickup.ngo.longitude),
        }
      : undefined,
  };
}

module.exports = {
  DONOR_SUMMARY,
  NGO_SUMMARY,
  toIso,
  toNumber,
  isDonationExpired,
  serializeDonation,
  serializePickup,
};
