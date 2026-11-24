import type { Clock } from '../../application/ports/clock.ts';

/** The machine's own clock. What the backend runs on in production. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
