// Seam: the HTTP API of the fully composed backend. Everything under /admin needs the token from a login, sent as
// `Authorization: Bearer <token>`, and refuses any request without a valid, unexpired one with 401.
//
// There are no admin routes yet (Events brings the first), so these tests knock on a path under /admin that no
// router answers: refused with 401 when the token is missing or bad, and let through to the usual 404 when it is
// good. That shows the guard sits in front of the whole /admin prefix, so no admin route can be added without it.
import { describe, expect, it } from 'vitest';
import { createTestBackend, logInAsAdmin, testClock } from '../support/test-backend.ts';
import { ADMIN_PASSWORD } from '../support/valid-env.ts';

const ADMIN_PATH = '/admin/no-route-here-yet';
const HOUR = 60 * 60 * 1000;

const base64url = (json: object) => Buffer.from(JSON.stringify(json)).toString('base64url');

describe('the admin guard', () => {
  it.each(['/admin', ADMIN_PATH])('refuses %s without a token with 401 LOGIN_REQUIRED', async (path) => {
    const api = await createTestBackend();

    const response = await api.get(path);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ code: 'LOGIN_REQUIRED', message: expect.any(String) });
  });

  it.each(['GET', 'POST', 'PUT', 'DELETE'] as const)('guards %s as well', async (method) => {
    const api = await createTestBackend();

    const response = await api[method.toLowerCase() as Lowercase<typeof method>](ADMIN_PATH);

    expect(response.status).toBe(401);
  });

  it('lets a request with the token from a login through', async () => {
    const api = await createTestBackend();
    const token = await logInAsAdmin(api);

    const response = await api.get(ADMIN_PATH).set('Authorization', `Bearer ${token}`);

    // past the guard: no route answers this path yet
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('ROUTE_NOT_FOUND');
  });

  it.each([
    ['a token sent some other way than Bearer', (token: string) => `Basic ${token}`],
    ['Bearer with no token', () => 'Bearer'],
    ['Bearer with a blank token', () => 'Bearer  '],
    ['the token without the word Bearer', (token: string) => token],
    ['something that is not a token at all', () => 'Bearer not-a-token'],
    ['a token with its signature removed', (token: string) => `Bearer ${token.split('.').slice(0, 2).join('.')}.`],
  ])('refuses %s with 401 LOGIN_REQUIRED', async (_case, authorization) => {
    const api = await createTestBackend();
    const token = await logInAsAdmin(api);

    const response = await api.get(ADMIN_PATH).set('Authorization', authorization(token));

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ code: 'LOGIN_REQUIRED', message: expect.any(String) });
  });

  it('refuses a token whose expiry was edited to last longer, because its signature no longer matches', async () => {
    const api = await createTestBackend();
    const [header, payload, signature] = (await logInAsAdmin(api)).split('.');
    const claims = JSON.parse(Buffer.from(payload!, 'base64url').toString());
    const forged = [header, base64url({ ...claims, exp: claims.exp + 365 * 24 * 3600 }), signature].join('.');

    const response = await api.get(ADMIN_PATH).set('Authorization', `Bearer ${forged}`);

    expect(response.status).toBe(401);
  });

  it('refuses an unsigned token that declares it needs no signature ("alg": "none")', async () => {
    const api = await createTestBackend();
    const unsigned = `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ exp: 4102444800 })}.`;

    const response = await api.get(ADMIN_PATH).set('Authorization', `Bearer ${unsigned}`);

    expect(response.status).toBe(401);
  });

  it('refuses a token signed with another secret, so changing JWT_SECRET signs every admin out', async () => {
    const before = await createTestBackend({ env: { JWT_SECRET: 'the-secret-before-it-was-changed-0123456789' } });
    const token = await logInAsAdmin(before);
    const after = await createTestBackend();

    const response = await after.get(ADMIN_PATH).set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
  });

  describe('when the admin password changes (a new ADMIN_PASSWORD_HASH, then a restart)', () => {
    // The hash of another made-up password, at bcrypt's lowest cost, like the one in VALID_ENV.
    const NEW_PASSWORD_HASH = '$2b$04$nEVOki6geixW3x4UOYouLOtgABI2RsL489zs..e7O9/VOyESI6ui2';

    it('refuses the sessions started under the old password with 401 LOGIN_REQUIRED, though JWT_SECRET is the same', async () => {
      const token = await logInAsAdmin(await createTestBackend());
      const restartedWithNewPassword = await createTestBackend({ env: { ADMIN_PASSWORD_HASH: NEW_PASSWORD_HASH } });

      const response = await restartedWithNewPassword.get(ADMIN_PATH).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ code: 'LOGIN_REQUIRED', message: expect.any(String) });
    });

    it('keeps them when the backend restarts with the same password', async () => {
      const token = await logInAsAdmin(await createTestBackend());
      const restarted = await createTestBackend();

      const response = await restarted.get(ADMIN_PATH).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('when the session ends, by the backend clock', () => {
    it('still lets the token through a second before 8 hours have passed', async () => {
      const clock = testClock();
      const api = await createTestBackend({ clock });
      const token = await logInAsAdmin(api);

      clock.advance(8 * HOUR - 1000);
      const response = await api.get(ADMIN_PATH).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('refuses the token with 401 LOGIN_REQUIRED once 8 hours have passed', async () => {
      const clock = testClock();
      const api = await createTestBackend({ clock });
      const token = await logInAsAdmin(api);

      clock.advance(8 * HOUR);
      const response = await api.get(ADMIN_PATH).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ code: 'LOGIN_REQUIRED', message: expect.any(String) });
    });

    it('ends it exactly at the expiresAt the login answered, even for a login part-way through a second', async () => {
      const clock = testClock();
      clock.advance(500);
      const api = await createTestBackend({ clock });
      const login = await api.post('/auth/login').send({ password: ADMIN_PASSWORD });
      const authorization = `Bearer ${login.body.token}`;
      const untilExpiry = () => new Date(login.body.expiresAt).getTime() - clock.now().getTime();

      clock.advance(untilExpiry() - 1);
      const justBefore = await api.get(ADMIN_PATH).set('Authorization', authorization);
      clock.advance(untilExpiry());
      const atExpiry = await api.get(ADMIN_PATH).set('Authorization', authorization);

      expect(justBefore.status).toBe(404);
      expect(atExpiry.status).toBe(401);
    });
  });
});

describe('public routes', () => {
  it('need no token', async () => {
    const api = await createTestBackend();

    const response = await api.get('/health');

    expect(response.status).toBe(200);
  });

  it('ignore a token that is no good, rather than refuse the request', async () => {
    const api = await createTestBackend();

    const response = await api.get('/health').set('Authorization', 'Bearer not-a-token');

    expect(response.status).toBe(200);
  });
});
