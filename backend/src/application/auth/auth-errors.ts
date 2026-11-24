// What admin access refuses, and why. These know nothing of HTTP: the interface layer (toHttpError) gives each
// one its status and code.

/** The password given at login is not the shared admin password. */
export class WrongPasswordError extends Error {
  override readonly name = 'WrongPasswordError';

  constructor() {
    super('That is not the admin password.');
  }
}

/** Too many failed logins from one address: it must wait until its window is over. */
export class TooManyFailedLoginsError extends Error {
  override readonly name = 'TooManyFailedLoginsError';
  /** How long until the address may try again, in whole seconds, rounded up. */
  readonly secondsToWait: number;

  constructor(secondsToWait: number) {
    const minutes = Math.ceil(secondsToWait / 60);
    super(`Too many wrong passwords. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`);
    this.secondsToWait = secondsToWait;
  }
}

/**
 * No session token at all, or one that this backend didn't sign, that was changed after it was signed, or that was
 * issued under an earlier admin password.
 */
export class InvalidSessionError extends Error {
  override readonly name = 'InvalidSessionError';

  constructor() {
    super('Log in to use the admin panel.');
  }
}

/** A session token past its expiry. */
export class SessionExpiredError extends Error {
  override readonly name = 'SessionExpiredError';

  constructor() {
    super('Your session has ended. Log in again.');
  }
}
