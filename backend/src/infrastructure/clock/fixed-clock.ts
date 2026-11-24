import type { Clock } from '../../application/ports/clock.ts';

/**
 * A clock stopped at one moment. The tests use it, and so can the browser suite's private backends, to pin "now"
 * to the same moment as the page's own time override.
 */
export class FixedClock implements Clock {
  // Kept as a number, not the caller's Date: a Date can be changed in place, and that must not move the clock.
  private readonly epochMilliseconds: number;

  constructor(instant: Date) {
    this.epochMilliseconds = instant.getTime();
  }

  now(): Date {
    return new Date(this.epochMilliseconds);
  }
}
