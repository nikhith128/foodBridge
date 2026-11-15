/**
 * Authentication and authorisation middleware.
 *
 * requireAuth  -> 401 unless a valid "Authorization: Bearer <token>" is present.
 * requireRole  -> 403 when the logged-in user's role is not allowed.
 *
 * Access is enforced here on the server, not merely by hiding buttons in the UI.
 */

const prisma = require('../config/prisma');
const { verifyToken } = require('../utils/jwt');

// Fields safe to send to the client. `password` is never included.
const SAFE_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  createdAt: true,
  organizationName: true,
  donorType: true,
  city: true,
  availability: true,
  hasVehicle: true,
  ngo: true,
};

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Send an "Authorization: Bearer <token>" header.',
      });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      // Covers expired, malformed and tampered tokens alike.
      return res.status(401).json({
        status: 'error',
        message: 'Your session is invalid or has expired. Please log in again.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: SAFE_USER_FIELDS,
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'This account no longer exists.',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Usage: router.get('/path', requireAuth, requireRole('NGO'), handler)
 * Must be placed after requireAuth.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `This action is only available to: ${allowedRoles.join(', ')}.`,
      });
    }

    return next();
  };
}

module.exports = { requireAuth, requireRole, SAFE_USER_FIELDS };
