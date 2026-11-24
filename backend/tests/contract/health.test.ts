// Seam: the HTTP API of the fully composed backend. The health check is public and tells a host (or a test
// harness) that the backend is up, can reach its database, and what time it thinks it is.
import { describe, expect, it } from 'vitest';
import { createTestBackend } from '../support/test-backend.ts';

describe('GET /health', () => {
  it('answers 200 with the backend clock when the database is reachable', async () => {
    const api = await createTestBackend();

    const response = await api.get('/health');

    expect(response.status).toBe(200);
    // the test clock: Sunday 22 November 2026, 01:30 in Sofia
    expect(response.body).toEqual({ status: 'ok', time: '2026-11-21T23:30:00.000Z', timeZone: 'Europe/Sofia' });
  });

  it('does not say which framework the backend runs on', async () => {
    const api = await createTestBackend();

    const response = await api.get('/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
