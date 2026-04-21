const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'puter-dev-secret';

/**
 * Middleware to verify JWT auth token
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Generate a JWT token for a user
 * Note: shortened default expiry to 1d for my local testing setup
 * (original was 7d)
 *
 * TODO: might want to include `role` in the payload once I add
 * role-based access control to my fork
 */
function generateToken(user, expiresIn = '1d') {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn }
  );
}

/**
 * Decode a token without verifying it - useful for debugging
 * expired tokens locally to inspect the payload
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = { requireAuth, generateToken, decodeToken };
