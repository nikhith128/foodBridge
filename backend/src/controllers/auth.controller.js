/**
 * Authentication controller: register, login, me.
 *
 * Passwords are hashed with bcrypt and never returned to the client.
 */

const bcrypt = require('bcrypt');

const prisma = require('../config/prisma');
const { validateRegister, validateLogin } = require('../utils/validators');
const { signToken } = require('../utils/jwt');
const { SAFE_USER_FIELDS } = require('../middleware/auth');

const BCRYPT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Creates an account. An NGO account also gets an NGO profile, created in the
 * same transaction so a half-registered organisation can never exist.
 */
async function register(req, res, next) {
  try {
    const { errors, data } = validateRegister(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please correct the highlighted fields.',
        errors,
      });
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with that email already exists.',
        errors: [{ field: 'email', message: 'That email is already registered.' }],
      });
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: passwordHash,
          role: data.role,
          phone: data.phone,
          organizationName: data.organizationName,
          donorType: data.donorType,
          city: data.city,
          availability: data.availability,
          hasVehicle: data.hasVehicle,
        },
      });

      if (data.role === 'NGO') {
        await tx.ngo.create({
          data: {
            userId: created.id,
            organizationName: data.organizationName,
            address: data.address,
            storageCapacity: data.storageCapacity,
            capacityNotes: data.capacityNotes,
            foodPreference: data.foodPreference,
            isAccepting: true,
            // MVP: new NGOs await manual approval, so matching will not
            // recommend them until an admin flips this to VERIFIED.
            verificationStatus: 'PENDING',
          },
        });
      }

      return tx.user.findUnique({ where: { id: created.id }, select: SAFE_USER_FIELDS });
    });

    return res.status(201).json({
      status: 'success',
      message: 'Account created.',
      token: signToken(user),
      user,
    });
  } catch (error) {
    // Safety net for a duplicate email that slipped past the check above.
    if (error.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        message: 'An account with that email already exists.',
        errors: [{ field: 'email', message: 'That email is already registered.' }],
      });
    }
    return next(error);
  }
}

/**
 * POST /api/auth/login
 * Returns a JWT on success. Failure messages are deliberately identical for
 * "no such account" and "wrong password" so the endpoint cannot be used to
 * discover which emails are registered.
 */
async function login(req, res, next) {
  try {
    const { errors, data } = validateLogin(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please correct the highlighted fields.',
        errors,
      });
    }

    const account = await prisma.user.findUnique({
      where: { email: data.email },
      select: { ...SAFE_USER_FIELDS, password: true },
    });

    if (!account) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password.',
      });
    }

    const passwordMatches = await bcrypt.compare(data.password, account.password);
    if (!passwordMatches) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password.',
      });
    }

    const { password: _password, ...user } = account;

    return res.json({
      status: 'success',
      message: 'Logged in.',
      token: signToken(user),
      user,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/auth/me
 * requireAuth has already loaded and verified the user.
 */
async function me(req, res) {
  return res.json({ status: 'success', user: req.user });
}

module.exports = { register, login, me };
