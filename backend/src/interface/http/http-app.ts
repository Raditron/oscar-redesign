import express, { type Express, type RequestHandler, type Router } from 'express';
import { cors, type CorsOptions } from './cors.ts';
import { errorHandler, routeNotFound } from './errors/error-handler.ts';
import type { Logger } from './logger.ts';

export interface HttpAppOptions {
  readonly cors: CorsOptions;
  /** How many reverse proxies to believe when they report the client's address in X-Forwarded-For. */
  readonly trustProxyHops: number;
  /** Every route of the API, one router per resource, each writing its paths in full. */
  readonly routers: readonly Router[];
  /** The guard in front of every path under /admin. */
  readonly requireAdmin: RequestHandler;
  readonly logger: Logger;
}

/** The Express application: what every request passes through, in order. */
export function createHttpApp(options: HttpAppOptions): Express {
  const app = express();
  // Don't announce "Express" in a header: it tells an attacker what to try and tells a client nothing.
  app.disable('x-powered-by');
  // Behind a host's reverse proxy every request arrives from the proxy's own address. This tells Express how many
  // proxies to look past, so `request.ip` is the client's, and failed logins are counted per client.
  app.set('trust proxy', options.trustProxyHops);
  // CORS before the routers, so errors raised inside a route carry the same CORS headers as successful answers
  // and the site can read them.
  app.use(cors(options.cors));
  // The guard sits on the /admin prefix itself, not on each admin router: every path under /admin, answered or
  // not, needs a token, so an admin route can't be added without it. It runs before the body is read, so nobody
  // without a token gets the server to parse what they send.
  app.use('/admin', options.requireAdmin);
  app.use(express.json());
  for (const router of options.routers) app.use(router);
  // Order matters: these two only run once no router above has answered.
  app.use(routeNotFound);
  app.use(errorHandler(options.logger));
  return app;
}
