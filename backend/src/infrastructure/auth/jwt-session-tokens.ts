import jwt from 'jsonwebtoken';
import type { Clock } from '../../application/ports/clock.ts';
import type { SessionDetails, SessionTokens } from '../../application/ports/session-tokens.ts';

// One algorithm, named on both sides: a verifier that accepts whatever the token's header claims can be tricked
// into accepting an unsigned token.
const ALGORITHM = 'HS256';

/**
 * Adapter: the SessionTokens port as JSON Web Tokens, signed with the JWT_SECRET from the env config.
 *
 * It takes the Clock only to hand the library a "now": left without one, jsonwebtoken reads the machine's clock,
 * both to stamp a token and to check one.
 */
export class JwtSessionTokens implements SessionTokens {
  private readonly secret: string;
  private readonly clock: Clock;

  constructor(secret: string, clock: Clock) {
    this.secret = secret;
    this.clock = clock;
  }

  issue({ expiresAt, passwordFingerprint }: SessionDetails): string {
    const claims = { iat: toSeconds(this.clock.now()), exp: toSeconds(expiresAt), passwordFingerprint };
    return jwt.sign(claims, this.secret, { algorithm: ALGORITHM });
  }

  read(token: string): SessionDetails | undefined {
    try {
      const payload = jwt.verify(token, this.secret, {
        algorithms: [ALGORITHM],
        // The library checks the signature only. Whether the session has ended is the application's call.
        ignoreExpiration: true,
        clockTimestamp: toSeconds(this.clock.now()),
      });
      if (typeof payload !== 'object') return undefined;
      const { exp, passwordFingerprint } = payload;
      if (typeof exp !== 'number' || typeof passwordFingerprint !== 'string') return undefined;
      return { expiresAt: new Date(exp * 1000), passwordFingerprint };
    } catch {
      return undefined;
    }
  }
}

/** JWTs count time in whole seconds since 1970. */
function toSeconds(instant: Date): number {
  return Math.floor(instant.getTime() / 1000);
}
