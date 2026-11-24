// Seam: the HTTP API of the fully composed backend. The WeeklySchedule an Admin saves in the VenueSettings is the
// one that decides the current ServiceNight, and so which Events are upcoming: change a day's closing time, and the
// Events guests see follow, at once and with no restart. Before any are saved there are no hours, so every day counts
// as closed. (Until the VenueSettings slice, a temporary adapter answers with fixed hours; these tests are what
// replacing it must achieve, with the Events code left as it is.)
// The test clock stands at Sunday 22 November 2026, 01:30 in Sofia; Saturday the 21st is the night before.
import { describe, expect, it } from 'vitest';
import { addEvents, adminEventList, eventOn } from '../support/events.ts';
import { expectStatus } from '../support/expect-status.ts';
import { createTestBackend, testClock, type TestApi } from '../support/test-backend.ts';
import { saveVenueSettings, SITE_VENUE_SETTINGS, withHoursOn } from '../support/venue-settings.ts';

const MINUTE = 60 * 1000;

const SATURDAY = '2026-11-21';
const SUNDAY = '2026-11-22';
const NEXT_SATURDAY = '2026-11-28';

/** The dates of the Events guests see now. */
async function publicEventDates(api: TestApi): Promise<string[]> {
  const response = await api.get('/public/events');
  expectStatus(response, 200);
  return response.body.map((event: { date: string }) => event.date);
}

describe('the WeeklySchedule in the VenueSettings decides which Events are upcoming', () => {
  it("keeps Saturday's Event listed at 01:30 on Sunday while Saturday closes at 03:00", async () => {
    const api = await createTestBackend();
    await saveVenueSettings(api, SITE_VENUE_SETTINGS);
    await addEvents(api, eventOn(SATURDAY), eventOn(NEXT_SATURDAY));

    expect(await publicEventDates(api)).toEqual([SATURDAY, NEXT_SATURDAY]);
  });

  it("drops Saturday's Event at 01:30 on Sunday as soon as Saturday's closing time moves before midnight", async () => {
    const api = await createTestBackend();
    await saveVenueSettings(api, SITE_VENUE_SETTINGS);
    await addEvents(api, eventOn(SATURDAY), eventOn(NEXT_SATURDAY));
    const before = await publicEventDates(api);

    await saveVenueSettings(api, withHoursOn('saturday', { opensAt: '18:00', closesAt: '23:00' }));
    const after = await publicEventDates(api);

    expect(before).toEqual([SATURDAY, NEXT_SATURDAY]);
    expect(after).toEqual([NEXT_SATURDAY]);
  });

  it("drops it from the upcoming ones in the admin panel's list too", async () => {
    const api = await createTestBackend();
    await saveVenueSettings(api, withHoursOn('saturday', { opensAt: '18:00', closesAt: '23:00' }));
    await addEvents(api, eventOn(SATURDAY));

    const [saturday] = await adminEventList(api);

    expect(saturday).toMatchObject({ date: SATURDAY, upcoming: false });
  });

  it("keeps Saturday's Event listed at 03:30 on Sunday once Saturday closes at 04:00", async () => {
    const clock = testClock();
    const api = await createTestBackend({ clock });
    await saveVenueSettings(api, withHoursOn('saturday', { opensAt: '18:00', closesAt: '04:00' }));
    await addEvents(api, eventOn(SATURDAY));

    clock.advance(2 * 60 * MINUTE); // Sunday 01:30 → 03:30

    expect(await publicEventDates(api)).toEqual([SATURDAY]);
  });

  it("drops Saturday's Event at 01:30 on Sunday when Saturday is closed", async () => {
    const api = await createTestBackend();
    await saveVenueSettings(api, withHoursOn('saturday', null));
    await addEvents(api, eventOn(SATURDAY), eventOn(NEXT_SATURDAY));

    expect(await publicEventDates(api)).toEqual([NEXT_SATURDAY]);
  });
});

describe('before any VenueSettings are saved', () => {
  it("counts every day as closed: at 01:30 on Sunday, Saturday's Event is gone and Sunday's is listed", async () => {
    const api = await createTestBackend();
    // No VenueSettings, so no hours: an Event is upcoming from its own date, and none is kept past midnight.
    expectStatus(await api.get('/public/venue-settings'), 404);
    await addEvents(api, eventOn(SATURDAY), eventOn(SUNDAY));

    expect(await publicEventDates(api)).toEqual([SUNDAY]);
  });
});
