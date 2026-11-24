// Seam: the HTTP API of the fully composed backend. Guests get the upcoming Events from GET /public/events, without
// a token: at most three, soonest first, each with its date, title and entry fee (null for free entry). An Event is
// upcoming until its ServiceNight ends, which on a Saturday is 03:00 on Sunday. The Events are added the way the
// admin panel adds them. The test clock stands at Sunday 22 November 2026, 01:30 in Sofia, in the bar's current hours
// (Mon–Wed and Sun until 23:30, Thu until 02:00, Fri–Sat until 03:00).
import { describe, expect, it } from 'vitest';
import { addEvents, eventOn, eventTitled } from '../support/events.ts';
import { createTestBackend, testClock } from '../support/test-backend.ts';

const MINUTE = 60 * 1000;

const datesIn = (body: { date: string }[]) => body.map((event) => event.date);

describe('GET /public/events', () => {
  it('lists the upcoming Events, soonest first, each with its date, title and entry fee', async () => {
    const api = await createTestBackend();
    await addEvents(api, eventOn('2026-12-05', 1000), eventOn('2026-11-28', 1500));

    const response = await api.get('/public/events');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { date: '2026-11-28', title: { bg: 'Парти на 2026-11-28', en: 'Party on 2026-11-28' }, entryFee: 1500 },
      { date: '2026-12-05', title: { bg: 'Парти на 2026-12-05', en: 'Party on 2026-12-05' }, entryFee: 1000 },
    ]);
  });

  it('lists no more than three: the three soonest', async () => {
    const api = await createTestBackend();
    await addEvents(api, eventOn('2026-12-19'), eventOn('2026-11-28'), eventOn('2026-12-12'), eventOn('2026-12-05'));

    const response = await api.get('/public/events');

    expect(datesIn(response.body)).toEqual(['2026-11-28', '2026-12-05', '2026-12-12']);
  });

  it('cuts the same three on every load when more Events share a date: on one date, they come in the order of their ids', async () => {
    const api = await createTestBackend();
    const added = await addEvents(api, ...['A', 'B', 'C', 'D', 'E', 'F'].map((letter) => eventTitled('2026-11-28', letter)));
    // Their ids are random, so the order they're added in tells nothing about the order the backend promises.
    const firstThreeById = [...added].sort((a, b) => (a.id < b.id ? -1 : 1)).slice(0, 3);

    const response = await api.get('/public/events');

    expect(response.body.map((event: { title: object }) => event.title)).toEqual(firstThreeById.map((event) => event.title));
  });

  it('leaves past Events out, and answers an empty list when nothing is upcoming', async () => {
    const api = await createTestBackend();
    await addEvents(api, eventOn('2026-10-31'), eventOn('2026-11-07'));

    const response = await api.get('/public/events');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns free entry as null, and an entry fee of 0 € as 0', async () => {
    const api = await createTestBackend();
    await addEvents(api, eventOn('2026-11-28', null), eventOn('2026-12-05', 0));

    const response = await api.get('/public/events');

    expect(response.body.map((event: { entryFee: number | null }) => event.entryFee)).toEqual([null, 0]);
  });

  describe('around midnight', () => {
    it("still lists Saturday's Event at 01:30 on Sunday, since Saturday's ServiceNight runs until 03:00", async () => {
      const api = await createTestBackend();
      await addEvents(api, eventOn('2026-11-21'), eventOn('2026-11-28'));

      const response = await api.get('/public/events');

      expect(datesIn(response.body)).toEqual(['2026-11-21', '2026-11-28']);
    });

    it("drops Saturday's Event at 03:00 on Sunday, when Saturday's ServiceNight ends", async () => {
      const clock = testClock();
      const api = await createTestBackend({ clock });
      await addEvents(api, eventOn('2026-11-21'), eventOn('2026-11-28'));

      clock.advance(90 * MINUTE);
      const response = await api.get('/public/events');

      expect(datesIn(response.body)).toEqual(['2026-11-28']);
    });

    it("drops Sunday's Event at 00:10 on Monday, since Sunday closed at 23:30", async () => {
      const clock = testClock();
      const api = await createTestBackend({ clock });
      await addEvents(api, eventOn('2026-11-22'), eventOn('2026-11-28'));

      clock.advance((22 * 60 + 40) * MINUTE); // Sunday 01:30 → Monday 00:10
      const response = await api.get('/public/events');

      expect(datesIn(response.body)).toEqual(['2026-11-28']);
    });
  });

  describe('caching', () => {
    it('lets a browser keep the list only if it checks back on every load, so a save shows on the next one', async () => {
      const api = await createTestBackend();

      const response = await api.get('/public/events');

      expect(response.headers['cache-control']).toBe('no-cache');
    });

    it('makes that check cheap: 304 while nothing has changed, the new list once an Admin has saved', async () => {
      const api = await createTestBackend();
      await addEvents(api, eventOn('2026-11-28'));
      const first = await api.get('/public/events');

      const unchanged = await api.get('/public/events').set('If-None-Match', first.headers.etag!);
      await addEvents(api, eventOn('2026-12-05'));
      const afterSave = await api.get('/public/events').set('If-None-Match', first.headers.etag!);

      expect(unchanged.status).toBe(304);
      expect(afterSave.status).toBe(200);
      expect(datesIn(afterSave.body)).toEqual(['2026-11-28', '2026-12-05']);
    });
  });
});
