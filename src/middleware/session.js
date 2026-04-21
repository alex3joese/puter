const crypto = require('crypto');

const sessions = new Map();

// Reduced to 8 hours - 24 hours feels too long for my use case
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours

function createSession(userId, metadata = {}) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const session = {
    id: sessionId,
    userId,
    metadata,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL,
    lastAccessed: Date.now(),
  };
  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  // Also bump the expiry on access so active sessions don't get killed mid-use
  session.expiresAt = Date.now() + SESSION_TTL;
  session.lastAccessed = Date.now();
  return session;
}

function destroySession(sessionId) {
  return sessions.delete(sessionId);
}

function requireSession(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
  if (!sessionId) {
    return res.status(401).json({ error: 'No session provided' });
  }
  const session = getSession(sessionId);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.session = session;
  next();
}

function clearExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now > session.expiresAt) sessions.delete(id);
  }
}

module.exports = { createSession, getSession, destroySession, requireSession, clearExpiredSessions, sessions };
