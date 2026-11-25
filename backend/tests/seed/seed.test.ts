// Seam: the seed, called the way a program calls it (the browser suite does, to fill each backend it starts). It
// logs in with the admin password and loads the site's current content through the admin API, the way the admin
// panel would. It fills an empty database only; forced, it adds only what is missing and never deletes anything.
// These tests are about the events step: each checks its own line of the seed's result, since the result also has
// a line for every other step once the owner's slices switch theirs on.
import { describe, expect, it } from 'vitest';
import { seed, SeedRefusedError } from '../../src/seed/seed.ts';
import { addEvent, addEvents, adminEventList, eventOn, type AdminEvent } from '../support/events.ts';
import { startTestBackend } from '../support/test-backend.ts';
import { ADMIN_PASSWORD } from '../support/valid-env.ts';

// The two Events on the site today (index.html and en/index.html, the music section), in 2026: both past by now.
const HALLOWEEN = {
  date: '2026-10-31',
  title: { bg: 'Halloween парти · DJ Павел Бочев', en: 'Halloween party · DJ Pavel Bochev' },
  entryFee: 1500,
};
const DISCOCKTAILS = {
  date: '2026-11-07',
  title: { bg: 'DISCOCKTAILS · Bo Vinyls на винил', en: 'DISCOCKTAILS · Bo Vinyls on vinyl' },
  entryFee: 1000,
};

const datesOf = (events: readonly { date: string }[]) => events.map((event) => event.date);
const datesAndFeesOf = (events: readonly AdminEvent[]) => events.map((event) => [event.date, event.entryFee]);

describe('seed', () => {
  it("loads the site's two Events into an empty database, as past Events, and says how many it added", async () => {
    const { url, api } = await startTestBackend();

    const loaded = await seed({ backendUrl: url, password: ADMIN_PASSWORD });

    expect(loaded).toContainEqual({ step: 'events', added: 2, skipped: 0 });
    expect(await adminEventList(api)).toEqual([
      { id: expect.any(String), ...DISCOCKTAILS, upcoming: false },
      { id: expect.any(String), ...HALLOWEEN, upcoming: false },
    ]);
  });

  it('leaves guests with no upcoming Events, since both are past', async () => {
    const { url, api } = await startTestBackend();

    await seed({ backendUrl: url, password: ADMIN_PASSWORD });

    expect((await api.get('/public/events')).body).toEqual([]);
  });

  it('refuses a database that already has Events, saying so, and changes nothing', async () => {
    const { url, api } = await startTestBackend();
    await addEvent(api, eventOn('2026-11-28'));

    const seeding = seed({ backendUrl: url, password: ADMIN_PASSWORD });

    await expect(seeding).rejects.toThrow(SeedRefusedError);
    await expect(seeding).rejects.toThrow(/already has events/);
    expect(datesOf(await adminEventList(api))).toEqual(['2026-11-28']);
  });

  describe('when forced', () => {
    it("adds only the site's Events that are missing, and leaves every Event already there as it is", async () => {
      const { url, api } = await startTestBackend();
      // One of the site's Events, which an Admin already added with another fee, and one of the Admin's own.
      await addEvents(api, { ...DISCOCKTAILS, entryFee: 1200 }, eventOn('2026-11-28', 2000));

      const loaded = await seed({ backendUrl: url, password: ADMIN_PASSWORD, force: true });

      expect(loaded).toContainEqual({ step: 'events', added: 1, skipped: 1 });
      expect(datesAndFeesOf(await adminEventList(api))).toEqual([
        ['2026-11-28', 2000],
        ['2026-11-07', 1200],
        ['2026-10-31', 1500],
      ]);
    });

    it('adds nothing a second time: run again, it skips everything it loaded before', async () => {
      const { url, api } = await startTestBackend();
      await seed({ backendUrl: url, password: ADMIN_PASSWORD });

      const loadedAgain = await seed({ backendUrl: url, password: ADMIN_PASSWORD, force: true });

      expect(loadedAgain).toContainEqual({ step: 'events', added: 0, skipped: 2 });
      expect(datesOf(await adminEventList(api))).toEqual(['2026-11-07', '2026-10-31']);
    });

    it('counts an Event as already there only when both its date and its title are the same', async () => {
      const { url, api } = await startTestBackend();
      await addEvents(api, { ...HALLOWEEN, title: { bg: 'Друго парти', en: 'Another party' } }, { ...DISCOCKTAILS, date: '2026-11-14' });

      const loaded = await seed({ backendUrl: url, password: ADMIN_PASSWORD, force: true });

      expect(loaded).toContainEqual({ step: 'events', added: 2, skipped: 0 });
      expect(datesOf(await adminEventList(api))).toEqual(['2026-11-14', '2026-11-07', '2026-10-31', '2026-10-31']);
    });
  });

  it('refuses a wrong password, saying so, and loads nothing', async () => {
    const { url, api } = await startTestBackend();

    const seeding = seed({ backendUrl: url, password: 'not the admin password' });

    await expect(seeding).rejects.toThrow(/password/);
    expect(await adminEventList(api)).toEqual([]);
  });
});
