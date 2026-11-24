import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Logger } from '../logger.ts';
import { HttpError, type ErrorBody } from './http-error.ts';
import { toHttpError } from './to-http-error.ts';

/** The last stop for a request no router answered: 404 in the shared format instead of Express's HTML page. */
export const routeNotFound: RequestHandler = (request, _response, next) => {
  next(new HttpError(404, { code: 'ROUTE_NOT_FOUND', message: `There is no ${request.method} ${request.path}.` }));
};

// The same words for every unexpected failure: the cause (a driver message, a stack trace, a host name) helps an
// attacker and means nothing to a guest, so it goes to the log only.
const INTERNAL_ERROR: ErrorBody = {
  code: 'INTERNAL_ERROR',
  message: 'Something went wrong on our side. Please try again later.',
};

/**
 * The one place errors become responses, so every route answers errors in the same format. Express 5 sends
 * here whatever a handler throws, including rejected promises from async handlers, so handlers just throw.
 */
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error, request, response, next) => {
    // Once a response has started there is no clean way to send an error body; Express's default handler then
    // closes the connection.
    if (response.headersSent) {
      next(error);
      return;
    }
    const expected = toHttpError(error);
    if (expected !== undefined) {
      response.status(expected.status).set(expected.headers).json(expected.body);
      return;
    }
    logger.error(`Unexpected error on ${request.method} ${request.path}`, error);
    response.status(500).json(INTERNAL_ERROR);
  };
}
