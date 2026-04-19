const express = require('express');
const router = express.Router();
const { generateToken } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts.' });

// Mock user lookup — replace with real DB call
async function findUser(username, password) {
  if (username === 'admin' && password === 'password') {
    return { id: '1', username: 'admin', email: 'admin@puter.com' };
  }
  return null;
}

/**
 * POST /auth/login
 */
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await findUser(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    return res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/logout
 */
router.post('/logout', (req, res) => {
  // JWT is stateless; client should discard token
  return res.json({ message: 'Logged out successfully' });
});

module.exports = router;
