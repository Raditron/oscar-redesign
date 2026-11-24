import { TooManyFailedLoginsError } from './auth-errors.ts';

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

/** One address's failed logins, counted from its first failure until WINDOW_MS later. */
interface FailureWindow {
  readonly startedAt: number;
  failures: number;
}

/**
 * The rule against guessing the password: an address that fails to log in 5 times within 15 minutes of its first
 * failure is refused until those 15 minutes are over. Then it starts again from nothing.
 *
 * The counts live in memory, so a restart forgets them. That only ever lets an address try again sooner, and it
 * spares the database a write for every wrong password.
 */
export class FailedLoginLimit {
  private readonly windows = new Map<string, FailureWindow>();

  /**
   * Lets an attempt from `address` go ahead at `now`, or throws TooManyFailedLoginsError, saying how long to wait.
   * One that goes ahead is counted as a failure straight away, before its password is checked: checking takes a
   * moment, and guesses sent all at once would otherwise all be let through before the first of them had counted.
   * `succeeded` takes the count back.
   */
  admit(address: string, now: Date): void {
    this.forgetEnded(now);
    const window = this.windows.get(address);
    if (window === undefined) {
      this.windows.set(address, { startedAt: now.getTime(), failures: 1 });
      return;
    }
    if (window.failures >= MAX_FAILURES) {
      throw new TooManyFailedLoginsError(Math.ceil((window.startedAt + WINDOW_MS - now.getTime()) / 1000));
    }
    window.failures += 1;
  }

  /** The attempt `admit` let through had the right password, so it was no failure after all. */
  succeeded(address: string): void {
    const window = this.windows.get(address);
    if (window === undefined) return;
    window.failures -= 1;
    // Without failures there is no window: the next one starts at the next failure, not at this success.
    if (window.failures <= 0) this.windows.delete(address);
  }

  // Ended windows are dropped on every attempt, so the map never holds more than 15 minutes' worth of addresses.
  private forgetEnded(now: Date): void {
    for (const [address, window] of this.windows) {
      if (now.getTime() - window.startedAt >= WINDOW_MS) this.windows.delete(address);
    }
  }
}
