// Seam: the HTTP API of the fully composed backend. Guests get the bar's VenueSettings from
// GET /public/venue-settings, without a token: the WeeklySchedule behind the hours table, the open-now line and the
// opening-hours JSON-LD; the HappyHour; and the Contacts every phone, email, address and Instagram link on the site
// shows. The VenueSettings are saved the way the admin panel saves them.
import { describe, expect, it } from 'vitest';
import { expectStatus } from '../support/expect-status.ts';
import { createTestBackend } from '../support/test-backend.ts';
import { saveVenueSettings, SITE_VENUE_SETTINGS, withHoursOn } from '../support/venue-settings.ts';

describe('GET /public/venue-settings', () => {
  it('gives the WeeklySchedule, the HappyHour and the Contacts', async () => {
    const api = await createTestBackend();
    await saveVenueSettings(api, SITE_VENUE_SETTINGS);

    const response = await api.get('/public/venue-settings');

    expectStatus(response, 200);
    expect(response.body).toEqual(SITE_VENUE_SETTINGS);
  });

  it('lets a browser keep them only if it checks back on every load, like every public answer', async () => {
    const api = await createTestBackend();
    await saveVenueSettings(api, SITE_VENUE_SETTINGS);

    const response = await api.get('/public/venue-settings');

    expectStatus(response, 200);
    expect(response.headers['cache-control']).toBe('no-cache');
  });

  it('gives a closed day as null', async () => {
    const api = await createTestBackend();
    await saveVenueSettings(api, withHoursOn('monday', null));

    const response = await api.get('/public/venue-settings');

    expectStatus(response, 200);
    expect(response.body.weeklySchedule.monday).toBeNull();
  });

  it("shows an Admin's save on the next load", async () => {
    const api = await createTestBackend();
    await saveVenueSettings(api, SITE_VENUE_SETTINGS);
    const changed = { ...SITE_VENUE_SETTINGS, happyHour: { from: '18:00', to: '19:00', discountPercent: 25 } };
    await saveVenueSettings(api, changed);

    const response = await api.get('/public/venue-settings');

    expectStatus(response, 200);
    expect(response.body).toEqual(changed);
  });

  it('answers 404 VENUE_SETTINGS_NOT_FOUND until they are first saved, so the site shows its "unavailable" state', async () => {
    const api = await createTestBackend();

    const response = await api.get('/public/venue-settings');

    expectStatus(response, 404);
    expect(response.body).toEqual({ code: 'VENUE_SETTINGS_NOT_FOUND', message: expect.any(String) });
  });
});
