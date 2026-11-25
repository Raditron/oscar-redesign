// Events for the tests, added and read back through the admin API, the way the admin panel does: never written to
// or read from the database directly.
import { expectStatus } from './expect-status.ts';
import { logInAsAdmin, type LocalizedTextJson, type TestApi } from './test-backend.ts';

/** An Event as the admin panel lists it. */
export interface AdminEvent {
  readonly id: string;
  readonly date: string;
  readonly title: LocalizedTextJson;
  readonly entryFee: number | null;
  readonly upcoming: boolean;
}

/** An Event's details as the admin panel sends them, on `date`, with a title that names the date. */
export function eventOn(date: string, entryFee: number | null = 1500) {
  return { date, title: { bg: `Парти на ${date}`, en: `Party on ${date}` }, entryFee };
}

/** An Event's details on `date`, with a title of its own, for telling Events on the same date apart. */
export function eventTitled(date: string, name: string) {
  return { ...eventOn(date), title: { bg: `Събитие ${name}`, en: `Event ${name}` } };
}

/** Adds the Events, one after another, as an Admin would, and returns them as the backend answered. */
export async function addEvents(api: TestApi, ...events: object[]): Promise<AdminEvent[]> {
  const authorization = `Bearer ${await logInAsAdmin(api)}`;
  const added: AdminEvent[] = [];
  for (const event of events) {
    const response = await api.post('/admin/events').set('Authorization', authorization).send(event);
    expectStatus(response, 201);
    added.push(response.body);
  }
  return added;
}

/** Adds one Event, as an Admin would, and returns it as the backend answered. */
export async function addEvent(api: TestApi, event: object): Promise<AdminEvent> {
  const [added] = await addEvents(api, event);
  return added!;
}

/** Every Event, as GET /admin/events lists them. */
export async function adminEventList(api: TestApi): Promise<AdminEvent[]> {
  const response = await api.get('/admin/events').set('Authorization', `Bearer ${await logInAsAdmin(api)}`);
  expectStatus(response, 200);
  return response.body;
}
