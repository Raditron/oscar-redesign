/** What a session token says about its session. Times are kept to the whole second. */
export interface SessionDetails {
  readonly expiresAt: Date;
  /** The AdminPassword fingerprint the session was started under. */
  readonly passwordFingerprint: string;
}

/**
 * Port: the signed token that carries an admin session from one request to the next, so the backend keeps no
 * session store. The application decides when a session starts and ends, by its Clock; an adapter only writes that
 * into a token it signs, and later reads it back from a token whose signature it has checked.
 */
export interface SessionTokens {
  /** A token, signed by this backend, that carries `session`. */
  issue(session: SessionDetails): string;
  /** The session in `token`, or undefined when the token isn't one this backend signed. */
  read(token: string): SessionDetails | undefined;
}
