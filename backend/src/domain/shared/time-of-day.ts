import { DomainError } from './domain-error.ts';

/** Text that isn't a time on a 24-hour clock. */
export class InvalidTimeOfDayError extends DomainError {
  override readonly name = 'InvalidTimeOfDayError';

  constructor(text: string) {
    super(`A time of day is written HH:MM, from 00:00 to 23:59, not "${text}".`);
  }
}

/**
 * A time on the bar's wall clock, to the minute, with no date: "18:00", "03:00". Opening and closing times are
 * these. Kept as minutes since midnight, so two times compare as numbers, and written HH:MM, the way the bar
 * writes its hours.
 */
export class TimeOfDay {
  private readonly minutesSinceMidnight: number;

  private constructor(minutesSinceMidnight: number) {
    this.minutesSinceMidnight = minutesSinceMidnight;
  }

  /** From "HH:MM" on a 24-hour clock: two digits each, so "7:00" and "24:00" are refused. */
  static parse(text: string): TimeOfDay {
    const match = /^(\d{2}):(\d{2})$/.exec(text);
    if (match === null) throw new InvalidTimeOfDayError(text);
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) throw new InvalidTimeOfDayError(text);
    return new TimeOfDay(hours * 60 + minutes);
  }

  isBefore(other: TimeOfDay): boolean {
    return this.minutesSinceMidnight < other.minutesSinceMidnight;
  }

  equals(other: TimeOfDay): boolean {
    return this.minutesSinceMidnight === other.minutesSinceMidnight;
  }

  toString(): string {
    const hours = Math.floor(this.minutesSinceMidnight / 60);
    return `${pad(hours)}:${pad(this.minutesSinceMidnight % 60)}`;
  }
}

const pad = (value: number) => String(value).padStart(2, '0');
