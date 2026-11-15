/**
 * JWT signing and verification.
 *
 * The token payload is deliberately small: the user id (`sub`) and the role.
 * Everything else is re-read from the database on each request, so a role
 * change or a deleted account takes effect immediately.
 */

const jwt = require('jsonwebtoken');

const EXPIRES_IN = '7d';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'JWT_SECRET is missing or too short. Set it in backend/.env (see .env.example).'
    );
  }
  return secret;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, getSecret(), {
    expiresIn: EXPIRES_IN,
  });
}

/** Throws if the token is invalid, expired or tampered with. */
function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken, EXPIRES_IN };
