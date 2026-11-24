// The backend under test: the real composition root, given a fresh database on the in-memory MongoDB, a fixed
// clock and the env config parsed from a valid environment. Tests talk to it only over HTTP (Supertest), the way
// the site and the admin panel will.
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { MongoClient, type Db } from 'mongodb';
import request from 'supertest';
import { inject, onTestFinished } from 'vitest';
import type { Clock } from '../../src/application/ports/clock.ts';
import { composeApp } from '../../src/composition-root.ts';
import { loadConfig } from '../../src/config.ts';
import { FixedClock } from '../../src/infrastructure/clock/fixed-clock.ts';
import { freePort } from './free-port.ts';
import { ADMIN_PASSWORD, VALID_ENV } from './valid-env.ts';

/** Sunday 22 November 2026, 01:30 in Sofia (UTC+2): still Saturday's ServiceNight. */
const TEST_NOW = new Date('2026-11-22T01:30:00+02:00');

/** The clock every test backend runs on, stopped at TEST_NOW. Pass one in to move time on during a test. */
export function testClock(): FixedClock {
  return new FixedClock(TEST_NOW);
}

export interface TestBackendOptions {
  /** Changes to the valid environment the backend is configured from. */
  readonly env?: Readonly<Record<string, string | undefined>>;
  /** Another database instead of a fresh one on the in-memory server. */
  readonly db?: Db;
  /** A clock the test keeps hold of, to advance it, instead of one of its own stopped at TEST_NOW. */
  readonly clock?: Clock;
}

export type TestApi = ReturnType<typeof request>;

/** Composes the backend for one test and returns an HTTP client for it. Everything is cleaned up when the test ends. */
export async function createTestBackend(options: TestBackendOptions = {}): Promise<TestApi> {
  return request(await composeTestApp(options));
}

/**
 * Like createTestBackend, but listening on a free local port, for a client that needs a real address: the seed,
 * or a process the test starts. Returns that address and an HTTP client for it. It stops when the test ends.
 */
export async function startTestBackend(options: TestBackendOptions = {}): Promise<{ url: string; api: TestApi }> {
  const app = await composeTestApp(options);
  const server = await new Promise<Server>((resolve, reject) => {
    const listening = app.listen(0, '127.0.0.1', (error) => (error ? reject(error) : resolve(listening)));
  });
  onTestFinished(() => {
    // close() only stops new connections and waits for the open ones to end, and a client's keep-alive sockets
    // (fetch keeps them open for reuse) would hold it for seconds. Closing them first lets it finish at once.
    server.closeAllConnections();
    server.close();
  });
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { url, api: request(url) };
}

async function composeTestApp(options: TestBackendOptions) {
  return composeApp({
    config: loadConfig({ ...VALID_ENV, ...options.env }),
    db: options.db ?? (await freshDatabase()),
    clock: options.clock ?? testClock(),
    logger: { error: () => {} }, // unexpected errors are expected in some tests; keep the output clean
  });
}

/** Logs in with the test password, the way the admin panel does, and returns the session's token. */
export async function logInAsAdmin(api: TestApi): Promise<string> {
  const response = await api.post('/auth/login').send({ password: ADMIN_PASSWORD });
  if (response.status !== 200) throw new Error(`logging in answered ${response.status}: ${JSON.stringify(response.body)}`);
  return response.body.token;
}

/** A backend for one test, and the Authorization header of an Admin logged in to it. */
export async function asAdmin(options: TestBackendOptions = {}): Promise<{ api: TestApi; authorization: string }> {
  const api = await createTestBackend(options);
  return { api, authorization: `Bearer ${await logInAsAdmin(api)}` };
}

async function freshDatabase(): Promise<Db> {
  const client = await new MongoClient(inject('mongoUri')).connect();
  const db = client.db(`test-${randomUUID()}`);
  onTestFinished(async () => {
    await db.dropDatabase();
    await client.close();
  });
  return db;
}

/** A database whose server is not there: a port nothing listens on, given up on after a quarter of a second. */
export async function unreachableDatabase(): Promise<Db> {
  const client = new MongoClient(`mongodb://127.0.0.1:${await freePort()}/oscar`, { serverSelectionTimeoutMS: 250 });
  onTestFinished(() => client.close());
  return client.db();
}
