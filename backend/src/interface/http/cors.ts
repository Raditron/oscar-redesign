import type { Request, RequestHandler } from 'express';

export interface CorsOptions {
  /** Exact origins allowed to call the API, e.g. https://oscarclubsofia.com. */
  readonly origins: readonly string[];
  /** Development only: also allow localhost and 127.0.0.1, on any port. */
  readonly allowLocalhost: boolean;
}

// What the site and the admin panel send: reads, JSON bodies, and the admin token as a Bearer header.
const ALLOWED_METHODS = 'GET, POST, PUT, DELETE';
const ALLOWED_HEADERS = 'Authorization, Content-Type';

/**
 * CORS for the site's origins only. An origin that isn't allowed gets no CORS headers at all, so the browser
 * refuses to hand the response to that page.
 *
 * Written out rather than taken from the `cors` package: it is short, and it sets `Vary: Origin` on every response,
 * allowed or not, so a shared cache never serves one origin's answer to another.
 */
export function cors({ origins, allowLocalhost }: CorsOptions): RequestHandler {
  const listed = new Set(origins);
  const isAllowed = (origin: string) => listed.has(origin) || (allowLocalhost && isLocalhost(origin));

  return (request, response, next) => {
    response.vary('Origin');
    const origin = request.get('Origin');
    if (origin === undefined || !isAllowed(origin)) {
      next();
      return;
    }
    response.set('Access-Control-Allow-Origin', origin);
    if (isPreflight(request)) {
      response.set({ 'Access-Control-Allow-Methods': ALLOWED_METHODS, 'Access-Control-Allow-Headers': ALLOWED_HEADERS });
      response.status(204).end();
      return;
    }
    next();
  };
}

/** The browser asking "may I send this?" before a request with a token, a JSON body, PUT or DELETE. */
function isPreflight(request: Request): boolean {
  return request.method === 'OPTIONS' && request.get('Access-Control-Request-Method') !== undefined;
}

/** localhost or 127.0.0.1, on any port: the origins that only `allowLocalhost` may allow. */
export function isLocalhost(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}
