import express, { type Express, type Router } from 'express';
import { cors, type CorsOptions } from './cors.ts';
import { errorHandler, routeNotFound } from './errors/error-handler.ts';
import type { Logger } from './logger.ts';

export interface HttpAppOptions {
  readonly cors: CorsOptions;
  /** Every route of the API, one router per resource. */
  readonly routers: readonly Router[];
  readonly logger: Logger;
}

/** The Express application: what every request passes through, in order. */
export function createHttpApp(options: HttpAppOptions): Express {
  const app = express();
  // Don't announce "Express" in a header: it tells an attacker what to try and tells a client nothing.
  app.disable('x-powered-by');
  // CORS before the routers, so errors raised inside a route carry the same CORS headers as successful answers
  // and the site can read them.
  app.use(cors(options.cors));
  for (const router of options.routers) app.use(router);
  // Order matters: these two only run once no router above has answered.
  app.use(routeNotFound);
  app.use(errorHandler(options.logger));
  return app;
}
