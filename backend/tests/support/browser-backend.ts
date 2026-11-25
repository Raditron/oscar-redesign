// A backend for the site's browser suite (the Playwright suite at the repo root; see its tests/backend.js): the real
// composition root on an in-memory MongoDB of its own, filled by the seed, with its clock stopped at one moment.
// Never a real database. It runs as a process of its own, from source under Node's type stripping (as the startup
// tests run src/main.ts), from this folder:
//
//   node --experimental-strip-types tests/support/browser-backend.ts --now 2026-11-22T01:30:00+02:00
//
// It listens on a free port on 127.0.0.1 and, once the seed is in, prints "Backend for the browser suite: <url>".
// Only then may it be used. Started with an IPC channel (as the suite's backends are), it also moves its clock on
// when sent { advanceClockBy: milliseconds }, answers { clockAdvancedBy: milliseconds }, and stops when the channel
// closes. The HTTP API is the real one: nothing here adds a route.
//
// MongoDB keeps its data in --db-path <empty folder> when given, else in a temp folder of its own. Stopping removes
// that folder. A process that is killed can't, so the suite gives each backend a folder and removes it itself once
// the process has gone (the repo root's tests/backend.js).
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { parseArgs } from 'node:util';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { composeApp } from '../../src/composition-root.ts';
import { loadConfig } from '../../src/config.ts';
import { FixedClock } from '../../src/infrastructure/clock/fixed-clock.ts';
import { seed } from '../../src/seed/seed.ts';
import { ADMIN_PASSWORD, VALID_ENV } from './valid-env.ts';

const { values } = parseArgs({ options: { now: { type: 'string' }, 'db-path': { type: 'string' } } });
const now = new Date(values.now ?? '');
if (Number.isNaN(now.getTime())) throw new Error('--now must be an instant with its offset, e.g. 2026-11-22T01:30:00+02:00');

// What has been started so far, each with how to end it; stop() ends them, the last first.
const running: (() => unknown)[] = [];
// The channel closes when the suite is done with this backend, or has itself ended. Listened for from the start, so
// a backend the suite gives up on while it is still starting stops too, with its MongoDB.
if (process.send) process.once('disconnect', () => void stop());

const clock = new FixedClock(now);
const mongo = await MongoMemoryServer.create({ instance: { dbPath: values['db-path'] } });
// force: the data folder goes too when it is one given with --db-path (mongodb-memory-server keeps those by default)
running.push(() => mongo.stop({ doCleanup: true, force: true }));
const client = await new MongoClient(mongo.getUri()).connect();
running.push(() => client.close());
const app = composeApp({
  // The suite's pages come from its static server on localhost, another origin than this one: allowed, as in
  // development. (The env config's PORT goes unused: this process picks a free port itself.)
  config: loadConfig({ ...VALID_ENV, CORS_ALLOW_LOCALHOST: 'true' }),
  db: client.db('oscar'),
  clock,
  logger: console,
});
const server = await new Promise<Server>((resolve, reject) => {
  const listening = app.listen(0, '127.0.0.1', (error) => (error ? reject(error) : resolve(listening)));
});
running.push(() => {
  // The page's keep-alive connections would hold close() open for seconds: end them first.
  server.closeAllConnections();
  server.close();
});
const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
await seed({ backendUrl: url, password: ADMIN_PASSWORD });
console.log(`Backend for the browser suite: ${url}`);

if (process.send) {
  process.on('message', (message: { advanceClockBy?: number }) => {
    if (typeof message.advanceClockBy !== 'number') return;
    clock.advance(message.advanceClockBy);
    process.send?.({ clockAdvancedBy: message.advanceClockBy });
  });
}

async function stop(): Promise<never> {
  while (running.length > 0) await running.pop()?.();
  // Whatever was still starting when the channel closed ends here too.
  process.exit();
}
