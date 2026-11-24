// Seam: the HTTP API of the fully composed backend. Five failed logins from one address within 15 minutes, and that
// address is refused with 429 until the 15 minutes are over, so the password can't be found by guessing. Time
// passes on the backend's own clock, moved on by the test.
import { describe, expect, it } from 'vitest';
import { createTestBackend, testClock, type TestApi } from '../support/test-backend.ts';
import { ADMIN_PASSWORD } from '../support/valid-env.ts';

const MINUTE = 60 * 1000;
const WRONG = 'a wrong guess';

const logIn = (api: TestApi, password: string) => api.post('/auth/login').send({ password });

async function failFiveTimes(api: TestApi): Promise<void> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    expect((await logIn(api, WRONG)).status, `failed login ${attempt}`).toBe(401);
  }
}

describe('the login rate limit', () => {
  it('answers the 6th failed login within 15 minutes with 429 TOO_MANY_FAILED_LOGINS', async () => {
    const api = await createTestBackend();
    await failFiveTimes(api);

    const response = await logIn(api, WRONG);

    expect(response.status).toBe(429);
    expect(response.body).toEqual({ code: 'TOO_MANY_FAILED_LOGINS', message: expect.any(String) });
  });

  it('says in Retry-After how many seconds are left until the 15 minutes are over', async () => {
    const clock = testClock();
    const api = await createTestBackend({ clock });
    await failFiveTimes(api);

    const atOnce = await logIn(api, WRONG);
    clock.advance(10 * MINUTE + 500);
    const later = await logIn(api, WRONG);

    expect(atOnce.headers['retry-after']).toBe('900');
    // 4 minutes 59.5 seconds left: rounded up, so a client that waits that long is let in
    expect(later.headers['retry-after']).toBe('300');
  });

  it('refuses even the right password until the 15 minutes are over', async () => {
    const clock = testClock();
    const api = await createTestBackend({ clock });
    await failFiveTimes(api);

    clock.advance(15 * MINUTE - 1000);
    const response = await logIn(api, ADMIN_PASSWORD);

    expect(response.status).toBe(429);
  });

  it('lets the right password in again once 15 minutes have passed since the first failure', async () => {
    const clock = testClock();
    const api = await createTestBackend({ clock });
    await failFiveTimes(api);

    clock.advance(15 * MINUTE);
    const response = await logIn(api, ADMIN_PASSWORD);

    expect(response.status).toBe(200);
  });

  it('allows five more failures after the window has passed, not one', async () => {
    const clock = testClock();
    const api = await createTestBackend({ clock });
    await failFiveTimes(api);

    clock.advance(15 * MINUTE);

    await failFiveTimes(api);
    expect((await logIn(api, WRONG)).status).toBe(429);
  });

  it('cannot be got round by sending many guesses at once', async () => {
    const api = await createTestBackend();

    const responses = await Promise.all(Array.from({ length: 10 }, () => logIn(api, WRONG)));

    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429, 429, 429, 429, 429]);
  });

  it('counts only failures: logging in successfully, again and again, is never limited', async () => {
    const api = await createTestBackend();

    for (let attempt = 1; attempt <= 10; attempt++) {
      expect((await logIn(api, ADMIN_PASSWORD)).status, `login ${attempt}`).toBe(200);
    }
  });

  it('does not count a request without a password as a failed login', async () => {
    const api = await createTestBackend();

    for (let attempt = 1; attempt <= 6; attempt++) await api.post('/auth/login').send({});

    expect((await logIn(api, ADMIN_PASSWORD)).status).toBe(200);
  });

  describe('which address a login comes from', () => {
    // Addresses from the documentation range (RFC 5737), as a reverse proxy would report them.
    const GUESSER = '203.0.113.7';
    const ADMIN = '198.51.100.20';

    const logInFrom = (api: TestApi, address: string, password: string) =>
      api.post('/auth/login').set('X-Forwarded-For', address).send({ password });

    it('behind a reverse proxy (TRUST_PROXY_HOPS=1), is the one the proxy reports, so each address is limited on its own', async () => {
      const api = await createTestBackend({ env: { TRUST_PROXY_HOPS: '1' } });
      for (let attempt = 1; attempt <= 5; attempt++) await logInFrom(api, GUESSER, WRONG);

      expect((await logInFrom(api, GUESSER, WRONG)).status).toBe(429);
      expect((await logInFrom(api, ADMIN, ADMIN_PASSWORD)).status).toBe(200);
    });

    it('is the connection\'s own by default, so a client cannot dodge the limit by claiming another one', async () => {
      const api = await createTestBackend();
      for (let attempt = 1; attempt <= 5; attempt++) await logInFrom(api, `203.0.113.${attempt}`, WRONG);

      expect((await logInFrom(api, '203.0.113.99', ADMIN_PASSWORD)).status).toBe(429);
    });
  });
});
