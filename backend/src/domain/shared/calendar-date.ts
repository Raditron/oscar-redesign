import { DomainError } from './domain-error.ts';

/** The days of the week, Monday first, as the bar lists its hours. */
export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Text that isn't a date on the calendar, such as "2026-02-30" or "31.10.2026". */
export class InvalidCalendarDateError extends DomainError {
  override readonly name = 'InvalidCalendarDateError';

  constructor(text: string) {
    super(`A date is written YYYY-MM-DD and must exist on the calendar, which "${text}" doesn't.`);
  }
}

/**
 * A day on the calendar, with no time and no time zone: "2026-10-31". An Event's date and a ServiceNight are these.
 *
 * Why not a JavaScript Date: a Date is an instant, and the same instant falls on different days in different time
 * zones. "The 31st of October" is a day in Sofia, wherever the server runs; as a Date at midnight it could turn into
 * the 30th the moment something reads it in UTC. A CalendarDate has no zone to be read in.
 */
export class CalendarDate {
  private readonly year: number;
  private readonly month: number;
  private readonly day: number;

  private constructor(year: number, month: number, day: number) {
    this.year = year;
    this.month = month;
    this.day = day;
  }

  /** From ISO 8601's YYYY-MM-DD, refusing any date the calendar doesn't have (2026-02-29, 2026-11-31). */
  static parse(text: string): CalendarDate {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (match === null) throw new InvalidCalendarDateError(text);
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) throw new InvalidCalendarDateError(text);
    return new CalendarDate(year, month, day);
  }

  get weekday(): Weekday {
    // getUTCDay counts from Sunday; WEEKDAYS starts on Monday.
    return WEEKDAYS[(this.atUtcMidnight().getUTCDay() + 6) % 7]!;
  }

  previousDay(): CalendarDate {
    const date = this.atUtcMidnight();
    date.setUTCDate(date.getUTCDate() - 1);
    return new CalendarDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  isBefore(other: CalendarDate): boolean {
    return CalendarDate.compare(this, other) < 0;
  }

  /** For sorting: negative when `a` comes first, positive when `b` does, 0 on the same day. */
  static compare(a: CalendarDate, b: CalendarDate): number {
    return a.year - b.year || a.month - b.month || a.day - b.day;
  }

  toString(): string {
    return `${String(this.year).padStart(4, '0')}-${pad(this.month)}-${pad(this.day)}`;
  }

  // Date arithmetic (the day before, the weekday) borrows a Date at midnight UTC, where no daylight saving moves it.
  // setUTCFullYear, not Date.UTC: Date.UTC reads the years 0–99 as 1900–1999.
  private atUtcMidnight(): Date {
    const date = new Date(0);
    date.setUTCFullYear(this.year, this.month - 1, this.day);
    return date;
  }
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const pad = (value: number) => String(value).padStart(2, '0');
