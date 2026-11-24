import type { AdminPassword } from '../ports/admin-password.ts';
import type { Clock } from '../ports/clock.ts';
import type { SessionTokens } from '../ports/session-tokens.ts';
import { InvalidSessionError, SessionExpiredError, WrongPasswordError } from './auth-errors.ts';
import type { FailedLoginLimit } from './failed-login-limit.ts';

/** What a successful login gives an Admin: a token to send with every admin request, and when it stops working. */
export interface AdminSession {
  readonly token: string;
  readonly expiresAt: Date;
}

// A working shift: an Admin logs in once per shift, not once per change.
const SESSION_LENGTH_MS = 8 * 60 * 60 * 1000;

/** The use cases of admin access: logging in with the shared password, and checking a session's token. */
export class AdminAuthService {
  private readonly adminPassword: AdminPassword;
  private readonly sessionTokens: SessionTokens;
  private readonly failedLogins: FailedLoginLimit;
  private readonly clock: Clock;

  constructor(adminPassword: AdminPassword, sessionTokens: SessionTokens, failedLogins: FailedLoginLimit, clock: Clock) {
    this.adminPassword = adminPassword;
    this.sessionTokens = sessionTokens;
    this.failedLogins = failedLogins;
    this.clock = clock;
  }

  /**
   * Starts an 8-hour session when `password` is the admin password. `address` is where the attempt comes from:
   * failed logins are limited per address.
   */
  async logIn(password: string, address: string): Promise<AdminSession> {
    const now = this.clock.now();
    this.failedLogins.admit(address, now);
    if (!(await this.adminPassword.matches(password))) throw new WrongPasswordError();
    this.failedLogins.succeeded(address);

    // Down to the whole second, as a session token keeps it, so the expiry an Admin is told is the token's own.
    const expiresAt = new Date(Math.floor((now.getTime() + SESSION_LENGTH_MS) / 1000) * 1000);
    const token = this.sessionTokens.issue({ expiresAt, passwordFingerprint: this.adminPassword.fingerprint });
    return { token, expiresAt };
  }

  /** Returns when `token` belongs to a session that is still running, and throws to say why when it doesn't. */
  checkSession(token: string): void {
    const session = this.sessionTokens.read(token);
    if (session === undefined) throw new InvalidSessionError();
    // A session belongs to the password it was started with, so a new password ends every session before it:
    // that is how the owner locks out someone who knew the old one.
    if (session.passwordFingerprint !== this.adminPassword.fingerprint) throw new InvalidSessionError();
    if (this.clock.now() >= session.expiresAt) throw new SessionExpiredError();
  }
}
