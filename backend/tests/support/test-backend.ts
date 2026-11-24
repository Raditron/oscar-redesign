// The backend under test: the real composition root, given a fresh database on the in-memory MongoDB, a fixed
// clock and the env config parsed from a valid environment. Tests talk to it only over HTTP (Supertest), the way
// the site and the admin panel will.
import { randomUUID } from 'node:crypto';
import { MongoClient, type Db } from 'mongodb';
import request from 'supertest';
import { inject, onTestFinished } from 'vitest';
import { composeApp } from '../../src/composition-root.ts';
import { loadConfig } from '../../src/config.ts';
import { FixedClock } from '../../src/infrastructure/clock/fixed-clock.ts';
import { freePort } from './free-port.ts';
import { VALID_ENV } from './valid-env.ts';

/** Sunday 22 November 2026, 01:30 in Sofia (UTC+2): still Saturday's ServiceNight. */
const TEST_NOW = new Date('2026-11-22T01:30:00+02:00');

export interface TestBackendOptions {
  /** Changes to the valid environment the backend is configured from. */
  readonly env?: Readonly<Record<string, string | undefined>>;
  /** Another database instead of a fresh one on the in-memory server. */
  readonly db?: Db;
}

export type TestApi = ReturnType<typeof request>;

/** Composes the backend for one test and returns an HTTP client for it. Everything is cleaned up when the test ends. */
export async function createTestBackend(options: TestBackendOptions = {}): Promise<TestApi> {
  const db = options.db ?? (await freshDatabase());
  const app = composeApp({
    config: loadConfig({ ...VALID_ENV, ...options.env }),
    db,
    clock: new FixedClock(TEST_NOW),
    logger: { error: () => {} }, // unexpected errors are expected in some tests; keep the output clean
  });
  return request(app);
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
