const crypto = require('crypto');

const sessions = new Map();

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
