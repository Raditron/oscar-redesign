import type { Request, RequestHandler } from 'express';
import type { AdminAuthService } from '../../../application/auth/admin-auth-service.ts';
import { InvalidSessionError } from '../../../application/auth/auth-errors.ts';

/**
 * The guard in front of every admin route: a request goes on only with `Authorization: Bearer <token>` for a
 * session that is still running. The HTTP part (finding the token in the header) is done here; whether the token
 * is good is the application's call. A request with no token is refused with the application's own error, so
 * toHttpError answers a missing, a bad and an expired token in one place.
 */
export function requireAdmin(auth: AdminAuthService): RequestHandler {
  return (request, _response, next) => {
    const token = bearerToken(request);
    if (token === undefined) throw new InvalidSessionError();
    auth.checkSession(token);
    next();
  };
}

/** The token in an `Authorization: Bearer <token>` header, or undefined when there is no such header. */
function bearerToken(request: Request): string | undefined {
  const match = /^Bearer +(\S+)\s*$/i.exec(request.get('Authorization') ?? '');
  return match?.[1];
}
