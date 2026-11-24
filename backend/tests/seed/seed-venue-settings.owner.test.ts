// Seam: the seed, called the way a program calls it. Once its step is switched on, it loads the bar's VenueSettings
// as the site shows them today into an empty database, through the admin API. There is one VenueSettings, so once
// an Admin has saved theirs, the seed never replaces them, forced or not.
import { describe, expect, it } from 'vitest';
import { seed, SeedRefusedError } from '../../src/seed/seed.ts';
import { startTestBackend } from '../support/test-backend.ts';
import { ADMIN_PASSWORD } from '../support/valid-env.ts';
import { adminVenueSettings, saveVenueSettings, SITE_VENUE_SETTINGS, withHoursOn } from '../support/venue-settings.ts';

describe('seed: the VenueSettings', () => {
  it("loads the site's hours, happy hour and contacts into an empty database, and says it added them", async () => {
    const { url, api } = await startTestBackend();

    const loaded = await seed({ backendUrl: url, password: ADMIN_PASSWORD });

    expect(await adminVenueSettings(api)).toEqual(SITE_VENUE_SETTINGS);
    expect(loaded).toContainEqual({ step: 'venue settings', added: 1, skipped: 0 });
  });

  it('refuses a database that already has VenueSettings, saying so, and changes nothing', async () => {
    const { url, api } = await startTestBackend();
    const closedOnMondays = withHoursOn('monday', null);
    await saveVenueSettings(api, closedOnMondays);

    const seeding = seed({ backendUrl: url, password: ADMIN_PASSWORD });

    await expect(seeding).rejects.toThrow(SeedRefusedError);
    await expect(seeding).rejects.toThrow(/already has venue settings/);
    expect(await adminVenueSettings(api)).toEqual(closedOnMondays);
  });

  it("when forced, leaves the VenueSettings an Admin saved as they are, and says it skipped them", async () => {
    const { url, api } = await startTestBackend();
    const closedOnMondays = withHoursOn('monday', null);
    await saveVenueSettings(api, closedOnMondays);

    const loaded = await seed({ backendUrl: url, password: ADMIN_PASSWORD, force: true });

    expect(await adminVenueSettings(api)).toEqual(closedOnMondays);
    expect(loaded).toContainEqual({ step: 'venue settings', added: 0, skipped: 1 });
  });
});
