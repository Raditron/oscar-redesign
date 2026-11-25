// Seam: the HTTP API of the fully composed backend. Every error, from any route, has the same JSON body:
// a machine-readable `code` and a human-readable `message` (validation errors add per-field `details`).
import { describe, expect, it } from 'vitest';
import { createTestBackend, unreachableDatabase } from '../support/test-backend.ts';

describe('the shared error format', () => {
  it.each([
    ['GET', '/no-such-route'],
    ['POST', '/health'], // a known path with a method it doesn't answer
    ['DELETE', '/'],
  ] as const)('answers %s %s, which is no route, with 404 ROUTE_NOT_FOUND', async (method, path) => {
    const api = await createTestBackend();

    const response = await api[method.toLowerCase() as Lowercase<typeof method>](path);

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual({ code: 'ROUTE_NOT_FOUND', message: expect.stringContaining(path) });
  });

  it('answers an unexpected failure with 500 INTERNAL_ERROR and nothing about its cause', async () => {
    // The database is down, so the health check fails. The driver's error names hosts, ports and its own
    // internals; all of that stays in the server's log.
    const api = await createTestBackend({ db: await unreachableDatabase() });

    const response = await api.get('/health');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ code: 'INTERNAL_ERROR', message: 'Something went wrong on our side. Please try again later.' });
  });

  describe('a JSON body the backend cannot read', () => {
    it('answers JSON that does not parse with 400 MALFORMED_JSON, without quoting it back', async () => {
      const api = await createTestBackend();

      const response = await api.post('/auth/login').set('Content-Type', 'application/json').send('{"password": "unfinished');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ code: 'MALFORMED_JSON', message: expect.any(String) });
      expect(response.body.message).not.toContain('unfinished');
    });

    it('answers a body over 100 kB with 413 BODY_TOO_LARGE', async () => {
      const api = await createTestBackend();

      const response = await api.post('/auth/login').send({ password: 'x'.repeat(100 * 1024) });

      expect(response.status).toBe(413);
      expect(response.body).toEqual({ code: 'BODY_TOO_LARGE', message: expect.any(String) });
    });

    it('answers a body in a character set other than UTF-8 with 415 UNREADABLE_BODY', async () => {
      const api = await createTestBackend();

      const response = await api
        .post('/auth/login')
        .set('Content-Type', 'application/json; charset=iso-8859-1')
        .send('{"password": "x"}');

      expect(response.status).toBe(415);
      expect(response.body).toEqual({ code: 'UNREADABLE_BODY', message: expect.any(String) });
    });
  });
});
