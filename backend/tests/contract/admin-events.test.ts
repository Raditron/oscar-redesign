// Seam: the HTTP API of the fully composed backend. The admin panel lists, adds, edits and deletes Events under
// /admin/events, with the token from a login. Prices cross the API as whole euro cents; free entry is an explicit
// null. The test clock stands at Sunday 22 November 2026, 01:30 in Sofia: in the bar's hours, still Saturday the
// 21st's ServiceNight, so a test that depends on that gives the backend the bar's hours first.
import { describe, expect, it } from 'vitest';
import { givenBarHours } from '../support/bar-hours.ts';
import { addEvent, addEvents, adminEventList, eventOn, eventTitled, type AdminEvent } from '../support/events.ts';
import { expectStatus } from '../support/expect-status.ts';
import { asAdmin } from '../support/test-backend.ts';

const NEXT_SATURDAY = {
  date: '2026-11-28',
  title: { bg: 'DISCOCKTAILS · Bo Vinyls на винил', en: 'DISCOCKTAILS · Bo Vinyls on vinyl' },
  entryFee: 1000,
};

describe('POST /admin/events', () => {
  it('adds an Event and answers 201 with it: its new id, its details, and whether it is upcoming', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api.post('/admin/events').set('Authorization', authorization).send(NEXT_SATURDAY);

    expectStatus(response, 201);
    expect(response.body).toEqual({ id: expect.any(String), ...NEXT_SATURDAY, upcoming: true });
  });

  it('adds an Event that is already past, for the record, and says it is not upcoming', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api.post('/admin/events').set('Authorization', authorization).send(eventOn('2026-10-31'));

    expectStatus(response, 201);
    expect(response.body.upcoming).toBe(false);
  });

  it('keeps free entry (null) and an entry fee of 0 € (0) apart', async () => {
    const { api, authorization } = await asAdmin();

    const free = await api.post('/admin/events').set('Authorization', authorization).send(eventOn('2026-11-28', null));
    const zero = await api.post('/admin/events').set('Authorization', authorization).send(eventOn('2026-12-05', 0));

    expectStatus(free, 201);
    expectStatus(zero, 201);
    expect(free.body.entryFee).toBeNull();
    expect(zero.body.entryFee).toBe(0);
  });

  it('drops the spaces around a title', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api
      .post('/admin/events')
      .set('Authorization', authorization)
      .send({ ...NEXT_SATURDAY, title: { bg: '  Парти ', en: ' Party  ' } });

    expectStatus(response, 201);
    expect(response.body.title).toEqual({ bg: 'Парти', en: 'Party' });
  });

  describe('refuses details it cannot keep with 400 VALIDATION_FAILED, naming each field', () => {
    it.each([
      ['a missing English title', { ...NEXT_SATURDAY, title: { bg: NEXT_SATURDAY.title.bg } }, ['title.en']],
      ['a blank Bulgarian title', { ...NEXT_SATURDAY, title: { ...NEXT_SATURDAY.title, bg: '   ' } }, ['title.bg']],
      ['a title that is not in both languages', { ...NEXT_SATURDAY, title: 'DISCOCKTAILS' }, ['title']],
      ['a negative entry fee', { ...NEXT_SATURDAY, entryFee: -500 }, ['entryFee']],
      ['an entry fee in euro, not cents', { ...NEXT_SATURDAY, entryFee: 12.5 }, ['entryFee']],
      ['an entry fee as text', { ...NEXT_SATURDAY, entryFee: '10 €' }, ['entryFee']],
      ['no entry fee at all, rather than null for free entry', { date: NEXT_SATURDAY.date, title: NEXT_SATURDAY.title }, ['entryFee']],
      ['a date the calendar does not have', { ...NEXT_SATURDAY, date: '2026-02-29' }, ['date']],
      ['a date written the way the site shows it', { ...NEXT_SATURDAY, date: '28.11.2026' }, ['date']],
      ['a date with a time', { ...NEXT_SATURDAY, date: '2026-11-28T21:00:00Z' }, ['date']],
      ['nothing at all', {}, ['date', 'title', 'entryFee']],
    ])('%s', async (_case, body, fields) => {
      const { api, authorization } = await asAdmin();

      const response = await api.post('/admin/events').set('Authorization', authorization).send(body);

      expectStatus(response, 400);
      expect(response.body).toEqual({
        code: 'VALIDATION_FAILED',
        message: expect.any(String),
        details: fields.map((field) => ({ field, message: expect.any(String) })),
      });
    });

    it('in words an Admin can act on', async () => {
      const { api, authorization } = await asAdmin();

      const response = await api
        .post('/admin/events')
        .set('Authorization', authorization)
        .send({ ...NEXT_SATURDAY, title: { bg: NEXT_SATURDAY.title.bg, en: '' } });

      expectStatus(response, 400);
      expect(response.body.details).toEqual([{ field: 'title.en', message: 'Enter the English title.' }]);
    });

    it('and keeps nothing it refused', async () => {
      const { api, authorization } = await asAdmin();
      const refused = await api.post('/admin/events').set('Authorization', authorization).send({ ...NEXT_SATURDAY, entryFee: -500 });

      expectStatus(refused, 400);
      expect(await adminEventList(api)).toEqual([]);
    });
  });
});

describe('GET /admin/events', () => {
  it('lists no Events before any are added', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api.get('/admin/events').set('Authorization', authorization);

    expectStatus(response, 200);
    expect(response.body).toEqual([]);
  });

  it('lists every Event: the upcoming ones first, soonest first, then the past ones, latest first', async () => {
    const { api, authorization } = await asAdmin();
    await givenBarHours(api);
    for (const date of ['2026-10-31', '2026-12-05', '2026-11-21', '2026-11-07', '2026-11-28']) {
      await addEvent(api, eventOn(date));
    }

    const response = await api.get('/admin/events').set('Authorization', authorization);

    expectStatus(response, 200);
    expect(response.body.map((event: { date: string; upcoming: boolean }) => [event.date, event.upcoming])).toEqual([
      ['2026-11-21', true], // Saturday: at 01:30 on Sunday it is still Saturday's ServiceNight
      ['2026-11-28', true],
      ['2026-12-05', true],
      ['2026-11-07', false],
      ['2026-10-31', false],
    ]);
  });

  it('lists Events that share a date in the order of their ids, upcoming and past alike, the same on every load', async () => {
    const { api, authorization } = await asAdmin();
    const upcoming = await addEvents(api, ...['A', 'B', 'C', 'D'].map((letter) => eventTitled('2026-11-28', letter)));
    const past = await addEvents(api, ...['A', 'B', 'C', 'D'].map((letter) => eventTitled('2026-11-07', letter)));
    // Their ids are random, so the order they're added in tells nothing about the order the backend promises.
    const idsInOrder = (events: readonly AdminEvent[]) => events.map((event) => event.id).sort();

    const response = await api.get('/admin/events').set('Authorization', authorization);

    expectStatus(response, 200);
    expect(response.body.map((event: AdminEvent) => event.id)).toEqual([...idsInOrder(upcoming), ...idsInOrder(past)]);
  });

  it('gives each Event its id and details', async () => {
    const { api, authorization } = await asAdmin();
    const { id } = await addEvent(api, NEXT_SATURDAY);

    const response = await api.get('/admin/events').set('Authorization', authorization);

    expectStatus(response, 200);
    expect(response.body).toEqual([{ id, ...NEXT_SATURDAY, upcoming: true }]);
  });
});

describe('PUT /admin/events/:id', () => {
  it('replaces the date, title and entry fee, and answers 200 with the Event as it now is', async () => {
    const { api, authorization } = await asAdmin();
    const { id } = await addEvent(api, NEXT_SATURDAY);
    const corrected = { date: '2026-11-07', title: { bg: 'Поправено', en: 'Corrected' }, entryFee: null };

    const response = await api.put(`/admin/events/${id}`).set('Authorization', authorization).send(corrected);

    expectStatus(response, 200);
    expect(response.body).toEqual({ id, ...corrected, upcoming: false });
  });

  it('keeps the change: the list shows the Event as edited, once', async () => {
    const { api, authorization } = await asAdmin();
    const { id } = await addEvent(api, NEXT_SATURDAY);
    const edited = await api.put(`/admin/events/${id}`).set('Authorization', authorization).send({ ...NEXT_SATURDAY, entryFee: 1500 });

    expectStatus(edited, 200);
    expect(await adminEventList(api)).toEqual([{ id, ...NEXT_SATURDAY, entryFee: 1500, upcoming: true }]);
  });

  it('answers an id no Event has with 404 EVENT_NOT_FOUND', async () => {
    const { api, authorization } = await asAdmin();

    const response = await api.put('/admin/events/no-such-event').set('Authorization', authorization).send(NEXT_SATURDAY);

    expectStatus(response, 404);
    expect(response.body).toEqual({ code: 'EVENT_NOT_FOUND', message: expect.any(String) });
  });

  it('refuses details it cannot keep with 400 VALIDATION_FAILED, and leaves the Event as it was', async () => {
    const { api, authorization } = await asAdmin();
    const { id } = await addEvent(api, NEXT_SATURDAY);

    const response = await api
      .put(`/admin/events/${id}`)
      .set('Authorization', authorization)
      .send({ ...NEXT_SATURDAY, entryFee: -1 });

    expectStatus(response, 400);
    expect(response.body.details).toEqual([{ field: 'entryFee', message: expect.any(String) }]);
    expect(await adminEventList(api)).toEqual([{ id, ...NEXT_SATURDAY, upcoming: true }]);
  });
});

describe('DELETE /admin/events/:id', () => {
  it('deletes the Event and answers 204 with no body', async () => {
    const { api, authorization } = await asAdmin();
    const { id } = await addEvent(api, NEXT_SATURDAY);
    const { id: keptId } = await addEvent(api, eventOn('2026-12-05'));

    const response = await api.delete(`/admin/events/${id}`).set('Authorization', authorization);

    expectStatus(response, 204);
    expect(response.text).toBe('');
    expect((await adminEventList(api)).map((event) => event.id)).toEqual([keptId]);
  });

  it('answers an id no Event has with 404 EVENT_NOT_FOUND, also when it was just deleted', async () => {
    const { api, authorization } = await asAdmin();
    const { id } = await addEvent(api, NEXT_SATURDAY);
    expectStatus(await api.delete(`/admin/events/${id}`).set('Authorization', authorization), 204);

    const response = await api.delete(`/admin/events/${id}`).set('Authorization', authorization);

    expectStatus(response, 404);
    expect(response.body).toEqual({ code: 'EVENT_NOT_FOUND', message: expect.any(String) });
  });
});

describe('an id in the path that is not valid percent-encoding', () => {
  it.each(['PUT', 'DELETE'] as const)('answers %s with 400 MALFORMED_URL, not 500', async (method) => {
    const { api, authorization } = await asAdmin();

    const response = await api[method === 'PUT' ? 'put' : 'delete']('/admin/events/%E0%A4%A')
      .set('Authorization', authorization)
      .send(NEXT_SATURDAY);

    expectStatus(response, 400);
    expect(response.body).toEqual({ code: 'MALFORMED_URL', message: expect.any(String) });
  });
});

describe('without a token', () => {
  it.each([
    ['GET', '/admin/events'],
    ['POST', '/admin/events'],
    ['PUT', '/admin/events/some-id'],
    ['DELETE', '/admin/events/some-id'],
  ] as const)('%s %s answers 401 LOGIN_REQUIRED and changes nothing', async (method, path) => {
    const { api } = await asAdmin();
    const { id } = await addEvent(api, NEXT_SATURDAY);

    const response = await api[method.toLowerCase() as Lowercase<typeof method>](path.replace('some-id', id)).send(eventOn('2026-12-05'));

    expectStatus(response, 401);
    expect(response.body).toEqual({ code: 'LOGIN_REQUIRED', message: expect.any(String) });
    expect(await adminEventList(api)).toEqual([{ id, ...NEXT_SATURDAY, upcoming: true }]);
  });
});
