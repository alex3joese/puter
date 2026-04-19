const { rateLimit, clearStore } = require('../rateLimit');

function mockReqRes(ip = '127.0.0.1') {
  const req = { ip, connection: { remoteAddress: ip } };
  const res = {
    headers: {},
    statusCode: 200,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  return { req, res };
}

beforeEach(() => clearStore());

describe('rateLimit middleware', () => {
  test('allows requests under the limit', () => {
    const middleware = rateLimit({ max: 3 });
    const next = jest.fn();
    const { req, res } = mockReqRes();

    middleware(req, res, next);
    middleware(req, res, next);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(3);
    expect(res.statusCode).toBe(200);
  });

  test('blocks requests over the limit', () => {
    const middleware = rateLimit({ max: 2 });
    const next = jest.fn();
    const { req, res } = mockReqRes();

    middleware(req, res, next);
    middleware(req, res, next);
    middleware(req, res, next); // 3rd should be blocked

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toMatch(/too many requests/i);
  });

  test('tracks IPs independently', () => {
    const middleware = rateLimit({ max: 1 });
    const next = jest.fn();
    const { req: req1, res: res1 } = mockReqRes('1.1.1.1');
    const { req: req2, res: res2 } = mockReqRes('2.2.2.2');

    middleware(req1, res1, next);
    middleware(req2, res2, next);

    expect(next).toHaveBeenCalledTimes(2);
  });
});
