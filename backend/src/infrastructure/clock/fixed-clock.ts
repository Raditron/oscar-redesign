import type { Clock } from '../../application/ports/clock.ts';

/**
 * A clock that stands still at one moment until it is moved on by hand. Every test backend runs on one, the backend's
 * own tests and the browser suite's alike: it pins "now" to the same moment as the page's own time override, and lets
 * time pass inside one running backend (a session expiring, a rate limit's window ending) without waiting for it.
 */
export class FixedClock implements Clock {
  // Kept as a number, not the caller's Date: a Date can be changed in place, and that must not move the clock.
  private epochMilliseconds: number;

  constructor(instant: Date) {
    this.epochMilliseconds = instant.getTime();
  }

  now(): Date {
    return new Date(this.epochMilliseconds);
  }

  advance(milliseconds: number): void {
    this.epochMilliseconds += milliseconds;
  }
}
