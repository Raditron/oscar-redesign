// The process entry point (`npm start`). It does only what a test can't hand in from outside: it reads the real
// environment, opens the real database connection, picks the system clock, and listens on a port. Everything
// else is built by composeApp, which the tests call directly with their own database and clock.
import type { Server } from 'node:http';
import type { Express } from 'express';
import { MongoClient } from 'mongodb';
import { composeApp } from './composition-root.ts';
import { ConfigError, loadConfig } from './config.ts';
import { SystemClock } from './infrastructure/clock/system-clock.ts';

async function main(): Promise<void> {
  // First, before anything is opened: a bad environment variable stops the process here.
  const config = loadConfig(process.env);

  // Connecting now, not on the first request, makes an unreachable database fail the deploy, not a guest.
  const client = await new MongoClient(config.mongoUri).connect();
  try {
    const app = composeApp({ config, db: client.db(), clock: new SystemClock(), logger: console });
    const server = await listen(app, config.port);
    console.log(`Oscar backend listening on port ${config.port}`);
    stopCleanlyOnSignal(server, client);
  } catch (error) {
    await client.close();
    throw error;
  }
}

function listen(app: Express, port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, (error) => (error ? reject(error) : resolve(server)));
  });
}

/** When the host stops the process: finish the requests in flight, then close the database connection. */
function stopCleanlyOnSignal(server: Server, client: MongoClient): void {
  const stop = () => server.close(() => void client.close());
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
}

main().catch((error: unknown) => {
  // A configuration problem is the operator's to fix, and its message says exactly what to fix: no stack trace.
  console.error(error instanceof ConfigError ? error.message : error);
  // exitCode rather than exit(): the message is written out in full before the process ends.
  process.exitCode = 1;
});
