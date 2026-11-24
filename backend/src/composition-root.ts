// The composition root: the one place that decides which implementation each port gets and builds every object,
// by hand, through constructors. No DI container: the whole object graph is readable top to bottom right here.
// Each later slice adds its repository, its service and its router below, in the same three steps.
import type { Express } from 'express';
import type { Db } from 'mongodb';
import { AdminAuthService } from './application/auth/admin-auth-service.ts';
import { FailedLoginLimit } from './application/auth/failed-login-limit.ts';
import { EventService } from './application/events/event-service.ts';
import { HealthService } from './application/health/health-service.ts';
import type { Clock } from './application/ports/clock.ts';
import type { Config } from './config.ts';
import { BcryptAdminPassword } from './infrastructure/auth/bcrypt-admin-password.ts';
import { JwtSessionTokens } from './infrastructure/auth/jwt-session-tokens.ts';
import { MongoDatabaseProbe } from './infrastructure/mongo/mongo-database-probe.ts';
import { MongoEventRepository } from './infrastructure/mongo/mongo-event-repository.ts';
import { FixedHoursScheduleProvider } from './infrastructure/schedule/fixed-hours-schedule-provider.ts';
import { loginRouter } from './interface/http/auth/login-router.ts';
import { requireAdmin } from './interface/http/auth/require-admin.ts';
import { eventsRouter } from './interface/http/events/events-router.ts';
import { healthRouter } from './interface/http/health/health-router.ts';
import { createHttpApp } from './interface/http/http-app.ts';
import type { Logger } from './interface/http/logger.ts';

/**
 * What differs between a real run and a test, so it is handed in rather than created here: main.ts passes the
 * real env config, database, system clock and console; tests pass an in-memory database, a fixed clock and a
 * silent logger.
 */
export interface AppDependencies {
  readonly config: Config;
  readonly db: Db;
  readonly clock: Clock;
  readonly logger: Logger;
}

/** Builds the whole backend and returns it as an Express app, ready to listen() or to be called by Supertest. */
export function composeApp({ config, db, clock, logger }: AppDependencies): Express {
  // infrastructure: adapters for the ports
  const databaseProbe = new MongoDatabaseProbe(db);
  const adminPassword = new BcryptAdminPassword(config.auth.adminPasswordHash);
  const sessionTokens = new JwtSessionTokens(config.auth.jwtSecret, clock);
  const eventRepository = new MongoEventRepository(db);
  const scheduleProvider = new FixedHoursScheduleProvider();

  // application: use cases, given ports only
  const health = new HealthService(databaseProbe, clock);
  const adminAuth = new AdminAuthService(adminPassword, sessionTokens, new FailedLoginLimit(), clock);
  const events = new EventService(eventRepository, scheduleProvider, clock);

  // interface: HTTP, one router per resource
  return createHttpApp({
    cors: config.cors,
    trustProxyHops: config.trustProxyHops,
    routers: [healthRouter(health), loginRouter(adminAuth), eventsRouter(events)],
    requireAdmin: requireAdmin(adminAuth),
    logger,
  });
}
