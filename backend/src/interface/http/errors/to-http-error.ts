import {
  InvalidSessionError,
  SessionExpiredError,
  TooManyFailedLoginsError,
  WrongPasswordError,
} from '../../../application/auth/auth-errors.ts';
import { EventNotFoundError } from '../../../application/events/event-errors.ts';
import { DomainError } from '../../../domain/shared/domain-error.ts';
import { HttpError } from './http-error.ts';

/**
 * The HTTP answer for every error the API expects, from any layer; undefined for anything unexpected. The domain
 * and application layers raise errors that know nothing of HTTP, and this is the one place they get a status and
 * a code. Their messages are written to be shown to people, so they are passed on as they are.
 */
export function toHttpError(error: unknown): HttpError | undefined {
  if (error instanceof HttpError) return error;
  if (error instanceof WrongPasswordError) return new HttpError(401, { code: 'WRONG_PASSWORD', message: error.message });
  if (error instanceof TooManyFailedLoginsError) {
    const retryAfter = { 'Retry-After': String(error.secondsToWait) };
    return new HttpError(429, { code: 'TOO_MANY_FAILED_LOGINS', message: error.message }, retryAfter);
  }
  // One code for a missing, bad or expired token: whichever it is, the admin panel asks for the password again.
  if (error instanceof InvalidSessionError || error instanceof SessionExpiredError) {
    return new HttpError(401, { code: 'LOGIN_REQUIRED', message: error.message });
  }
  if (error instanceof EventNotFoundError) return new HttpError(404, { code: 'EVENT_NOT_FOUND', message: error.message });
  // A backstop. Request bodies are checked by their zod schemas first, which name each field; a DomainError only
  // gets here if a schema let through a value the domain refuses. Still the client's value, so still a 400, with
  // the domain's message but no field, since the domain doesn't know the request's field names.
  if (error instanceof DomainError) return new HttpError(400, { code: 'VALIDATION_FAILED', message: error.message });
  if (isMalformedUrl(error)) {
    return new HttpError(400, { code: 'MALFORMED_URL', message: 'The address has a %-escape that does not decode.' });
  }
  if (isUnreadableBody(error)) return unreadableBody(error);
  return undefined;
}

/**
 * What Express's router throws when a route parameter (an Event's id in /admin/events/:id, say) holds a %-escape
 * that doesn't decode, such as %E0%A4%A: a URIError it has marked with status 400. Its message, which quotes the
 * parameter, is never passed on.
 */
function isMalformedUrl(error: unknown): boolean {
  return error instanceof URIError && 'status' in error && error.status === 400;
}

/**
 * What Express's JSON body parser throws when the client sent a body it can't read: an error carrying a 4xx
 * status and a `type`. (Its errors with a 5xx status are the server's own problem, so they stay unexpected.)
 */
interface UnreadableBodyError {
  readonly status: number;
  readonly type: string;
}

function isUnreadableBody(error: unknown): error is UnreadableBodyError {
  return (
    error instanceof Error &&
    'type' in error &&
    typeof error.type === 'string' &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
  );
}

// The parser's own messages are never passed on: a JSON syntax error quotes the body back, and a login body holds
// the password.
function unreadableBody(error: UnreadableBodyError): HttpError {
  switch (error.type) {
    case 'entity.parse.failed':
      return new HttpError(400, { code: 'MALFORMED_JSON', message: 'The request body is not valid JSON.' });
    case 'entity.too.large':
      return new HttpError(413, { code: 'BODY_TOO_LARGE', message: 'The request body is too large.' });
    default: // e.g. a character set other than UTF-8, or a compression it doesn't know
      return new HttpError(error.status, { code: 'UNREADABLE_BODY', message: 'The request body could not be read.' });
  }
}
