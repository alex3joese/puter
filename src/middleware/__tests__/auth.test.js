const { requireAuth, generateToken } = require('../auth');

describe('auth middleware', () => {
  let mockReq, mockRes, nextFn;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFn = jest.fn();
  });

  describe('generateToken', () => {
    it('should generate a non-empty token string', () => {
      const token = generateToken({ id: 'user-123', email: 'test@example.com' });
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens for different payloads', () => {
      const token1 = generateToken({ id: 'user-1' });
      const token2 = generateToken({ id: 'user-2' });
      expect(token1).not.toBe(token2);
    });

    // tokens for the same payload generated at different times should also differ
    // (assuming the implementation includes iat or similar)
    it('should generate unique tokens for the same payload at different times', async () => {
      const payload = { id: 'user-123' };
      const token1 = generateToken(payload);
      await new Promise((r) => setTimeout(r, 1100));
      const token2 = generateToken(payload);
      expect(token1).not.toBe(token2);
    }, 10000);
  });

  describe('requireAuth', () => {
    it('should call next() when a valid token is provided', () => {
      const token = generateToken({ id: 'user-123', email: 'test@example.com' });
      mockReq.headers['authorization'] = `Bearer ${token}`;

      requireAuth(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no authorization header is present', () => {
      requireAuth(mockReq, mockRes, nextFn);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
      expect(nextFn).not.toHaveBeenCalled();
    });

    it('should return 401 when token is malformed', () => {
      mockReq.headers['authorization'] = 'Bearer not.a.valid.token';

      requireAuth(mockReq, mockRes, nextFn);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(nextFn).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization scheme is not Bearer', () => {
      const token = generateToken({ id: 'user-123' });
      mockReq.headers['authorization'] = `Basic ${token}`;

      requireAuth(mockReq, mockRes, nextFn);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(nextFn).not.toHaveBeenCalled();
    });

    it('should attach user payload to req.user on success', () => {
      const payload = { id: 'user-123', email: 'test@example.com' };
      const token = generateToken(payload);
      mockReq.headers['authorization'] = `Bearer ${token}`;

      requireAuth(mockReq, mockRes, nextFn);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(payload.id);
      expect(mockReq.user.email).toBe(payload.email);
    });

    // make sure the header check is case-insensitive since HTTP headers are case-insensitive
    it('should handle Authorization header with different casing', () => {
      const token = generateToken({ id: 'user-123' });
      mockReq.headers['Authorization'] = `Bearer ${token}`;

      requireAuth(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
