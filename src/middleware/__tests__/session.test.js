const { createSession, getSession, destroySession, clearExpiredSessions, sessions } = require('../session');

beforeEach(() => {
  sessions.clear();
});

describe('createSession', () => {
  it('creates a session with correct fields', () => {
    const session = createSession('user123', { ip: '127.0.0.1' });
    expect(session.userId).toBe('user123');
    expect(session.metadata.ip).toBe('127.0.0.1');
    expect(session.id).toHaveLength(64);
    expect(session.expiresAt).toBeGreaterThan(Date.now());
  });

  it('stores session in map', () => {
    const session = createSession('user456');
    expect(sessions.has(session.id)).toBe(true);
  });
});

describe('getSession', () => {
  it('returns session by id', () => {
    const session = createSession('user1');
    const found = getSession(session.id);
    expect(found).not.toBeNull();
    expect(found.userId).toBe('user1');
  });

  it('returns null for unknown id', () => {
    expect(getSession('nonexistent')).toBeNull();
  });

  it('returns null and removes expired session', () => {
    const session = createSession('user2');
    session.expiresAt = Date.now() - 1000;
    sessions.set(session.id, session);
    expect(getSession(session.id)).toBeNull();
    expect(sessions.has(session.id)).toBe(false);
  });
});

describe('destroySession', () => {
  it('removes session from map', () => {
    const session = createSession('user3');
    destroySession(session.id);
    expect(sessions.has(session.id)).toBe(false);
  });
});

describe('clearExpiredSessions', () => {
  it('clears only expired sessions', () => {
    const active = createSession('active');
    const expired = createSession('expired');
    expired.expiresAt = Date.now() - 1000;
    sessions.set(expired.id, expired);
    clearExpiredSessions();
    expect(sessions.has(active.id)).toBe(true);
    expect(sessions.has(expired.id)).toBe(false);
  });
});
