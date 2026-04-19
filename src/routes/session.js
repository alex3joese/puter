const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { createSession, destroySession, getSession, requireSession } = require('../middleware/session');

// Create a new session after auth
router.post('/create', requireAuth, (req, res) => {
  try {
    const session = createSession(req.user.id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(201).json({
      sessionId: session.id,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get current session info
router.get('/me', requireSession, (req, res) => {
  const { id, userId, createdAt, expiresAt, lastAccessed, metadata } = req.session;
  res.json({ id, userId, createdAt, expiresAt, lastAccessed, metadata });
});

// Destroy a session (logout)
router.delete('/destroy', requireSession, (req, res) => {
  const destroyed = destroySession(req.session.id);
  if (destroyed) {
    return res.json({ message: 'Session destroyed' });
  }
  res.status(500).json({ error: 'Failed to destroy session' });
});

module.exports = router;
