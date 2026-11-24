// Seam: the HTTP API of the fully composed backend. An admin logs in with the one shared password and gets a token
// for an 8-hour session; anything else is refused in the shared error format.
import { describe, expect, it } from 'vitest';
import { createTestBackend } from '../support/test-backend.ts';
import { ADMIN_PASSWORD, VALID_ENV } from '../support/valid-env.ts';

describe('POST /auth/login', () => {
  it('answers the right password with a token and the moment its session ends, 8 hours from now', async () => {
    const api = await createTestBackend();

    const response = await api.post('/auth/login').send({ password: ADMIN_PASSWORD });

    expect(response.status).toBe(200);
    // the test clock is Sunday 22 November 2026, 01:30 in Sofia; 8 hours later is 09:30 there
    expect(response.body).toEqual({ token: expect.any(String), expiresAt: '2026-11-22T07:30:00.000Z' });
  });

  it('tells every cache not to keep the answer, since the token in it lets anyone in', async () => {
    const api = await createTestBackend();

    const response = await api.post('/auth/login').send({ password: ADMIN_PASSWORD });

    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('gives a token that carries neither the password nor its hash, since anyone holding it can read it', async () => {
    const api = await createTestBackend();

    const response = await api.post('/auth/login').send({ password: ADMIN_PASSWORD });

    const readable = (response.body.token as string)
      .split('.')
      .map((part) => Buffer.from(part, 'base64url').toString())
      .join('.');
    expect(readable).not.toContain(ADMIN_PASSWORD);
    expect(readable).not.toContain(VALID_ENV.ADMIN_PASSWORD_HASH);
  });

  it.each(['not the admin password', `${ADMIN_PASSWORD} `, ADMIN_PASSWORD.toUpperCase()])(
    'answers a wrong password (%j) with 401 WRONG_PASSWORD and no token',
    async (password) => {
      const api = await createTestBackend();

      const response = await api.post('/auth/login').send({ password });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ code: 'WRONG_PASSWORD', message: expect.any(String) });
    },
  );

  it.each([
    ['no password', {}],
    ['an empty password', { password: '' }],
    ['a password that is not text', { password: 12345678 }],
  ])('answers a body with %s with 400 VALIDATION_FAILED, naming the field', async (_case, body) => {
    const api = await createTestBackend();

    const response = await api.post('/auth/login').send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      code: 'VALIDATION_FAILED',
      message: expect.any(String),
      details: [{ field: 'password', message: expect.any(String) }],
    });
  });

  it('answers a request with no JSON body as if the password were missing', async () => {
    const api = await createTestBackend();

    const response = await api.post('/auth/login');

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual([{ field: 'password', message: expect.any(String) }]);
  });
});
