// Seam: the HTTP API of the fully composed backend, as a browser on another origin sees it. The site calls the
// backend cross-origin (with an Authorization header and PUT/DELETE from the admin panel), so the configured
// origins get CORS headers and every other origin gets none, which makes the browser refuse to hand the response
// to the page.
import type { Response } from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestBackend, unreachableDatabase } from '../support/test-backend.ts';

const SITE = 'https://oscarclubsofia.com'; // the one origin in the test environment's CORS_ORIGINS
const FOREIGN = 'https://elsewhere.example';

const corsHeaders = (response: Response) => Object.keys(response.headers).filter((name) => name.startsWith('access-control-'));

describe('CORS', () => {
  it("lets the site's own origin read responses", async () => {
    const api = await createTestBackend();

    const response = await api.get('/health').set('Origin', SITE);

    expect(response.headers['access-control-allow-origin']).toBe(SITE);
  });

  it('lets the site read error responses too, so it can show what went wrong', async () => {
    // an error raised inside a route: the health check, with the database down
    const api = await createTestBackend({ db: await unreachableDatabase() });

    const response = await api.get('/health').set('Origin', SITE);

    expect(response.status).toBe(500);
    expect(response.headers['access-control-allow-origin']).toBe(SITE);
  });

  it('lets the site read Retry-After on a 429, so the admin panel can say how long the wait is', async () => {
    // A browser hands a page on another origin only the "safelisted" headers unless the answer exposes more
    const api = await createTestBackend();
    for (let attempt = 1; attempt <= 5; attempt++) {
      await api.post('/auth/login').set('Origin', SITE).send({ password: 'a wrong guess' });
    }

    const response = await api.post('/auth/login').set('Origin', SITE).send({ password: 'a wrong guess' });

    const exposed = (response.headers['access-control-expose-headers'] ?? '').toLowerCase().split(/\s*,\s*/);
    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBeDefined();
    expect(exposed).toContain('retry-after');
  });

  it.each(['https://oscarclubsofia.com', 'https://www.oscarclubsofia.com', 'http://oscarclubsofia.com'])(
    'lets %s read responses when CORS_ORIGINS lists several origins, with or without a space after each comma',
    async (origin) => {
      const api = await createTestBackend({
        env: { CORS_ORIGINS: 'https://oscarclubsofia.com, https://www.oscarclubsofia.com,http://oscarclubsofia.com' },
      });

      const response = await api.get('/health').set('Origin', origin);

      expect(response.headers['access-control-allow-origin']).toBe(origin);
    },
  );

  it('gives an origin that is not on the list no CORS headers', async () => {
    const api = await createTestBackend();

    const response = await api.get('/health').set('Origin', FOREIGN);

    expect(corsHeaders(response)).toEqual([]);
  });

  it.each(['POST', 'PUT', 'DELETE'])("answers the site's preflight for a %s with a token and a JSON body", async (method) => {
    const api = await createTestBackend();

    const response = await api
      .options('/any/admin/route')
      .set('Origin', SITE)
      .set('Access-Control-Request-Method', method)
      .set('Access-Control-Request-Headers', 'authorization,content-type');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(SITE);
    expect(response.headers['access-control-allow-methods']).toContain(method);
    expect(response.headers['access-control-allow-headers']?.toLowerCase()).toMatch(/authorization.*content-type|content-type.*authorization/);
  });

  it('gives a preflight from an origin that is not on the list no CORS headers', async () => {
    const api = await createTestBackend();

    const response = await api
      .options('/health')
      .set('Origin', FOREIGN)
      .set('Access-Control-Request-Method', 'DELETE')
      .set('Access-Control-Request-Headers', 'authorization');

    expect(corsHeaders(response)).toEqual([]);
  });

  it.each([
    ['the site', SITE],
    ['a foreign origin', FOREIGN],
    ['no origin at all', undefined],
  ])('tells caches the answer depends on the origin, for %s', async (_who, origin) => {
    // Otherwise a shared cache could store the answer given to one origin (without CORS headers) and hand it to
    // the site, whose browser would then refuse it.
    const api = await createTestBackend();

    const response = origin === undefined ? await api.get('/health') : await api.get('/health').set('Origin', origin);

    expect(response.headers.vary).toMatch(/\bOrigin\b/);
  });

  describe('localhost, for development', () => {
    const LOCAL = ['http://localhost:4173', 'http://127.0.0.1:5173', 'http://localhost'];

    it.each(LOCAL)('refuses %s by default', async (origin) => {
      const api = await createTestBackend();

      const response = await api.get('/health').set('Origin', origin);

      expect(corsHeaders(response)).toEqual([]);
    });

    it.each(['', 'false'])('refuses localhost when CORS_ALLOW_LOCALHOST=%s', async (value) => {
      const api = await createTestBackend({ env: { CORS_ALLOW_LOCALHOST: value } });

      const response = await api.get('/health').set('Origin', 'http://localhost:4173');

      expect(corsHeaders(response)).toEqual([]);
    });

    it.each(LOCAL)('allows %s when CORS_ALLOW_LOCALHOST=true', async (origin) => {
      const api = await createTestBackend({ env: { CORS_ALLOW_LOCALHOST: 'true' } });

      const response = await api.get('/health').set('Origin', origin);

      expect(response.headers['access-control-allow-origin']).toBe(origin);
    });

    it.each(['http://localhost.elsewhere.example', 'http://127.0.0.1.elsewhere.example:4173'])(
      'still refuses the look-alike %s when localhost is allowed',
      async (origin) => {
        const api = await createTestBackend({ env: { CORS_ALLOW_LOCALHOST: 'true' } });

        const response = await api.get('/health').set('Origin', origin);

        expect(corsHeaders(response)).toEqual([]);
      },
    );
  });
});
