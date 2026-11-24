// Seam: the domain layer, without HTTP or a database. A calendar date is a day with no time and no time zone, the
// way an Event's date is kept: what it allows and what it refuses.
import { describe, expect, it } from 'vitest';
import { CalendarDate, InvalidCalendarDateError } from '../../src/domain/shared/calendar-date.ts';

describe('a calendar date', () => {
  it.each(['2026-10-31', '2028-02-29', '2000-02-29', '2026-12-31'])('allows %s', (text) => {
    expect(CalendarDate.parse(text).toString()).toBe(text);
  });

  it.each([
    ['a 29 February outside a leap year', '2026-02-29'],
    ['a 29 February in a century year that is not a leap year', '2100-02-29'],
    ['a 31st in a month of 30 days', '2026-11-31'],
    ['a thirteenth month', '2026-13-01'],
    ['a day 0', '2026-11-00'],
    ['the way the site writes dates', '31.10.2026'],
    ['a date without leading zeros', '2026-1-5'],
    ['a date with a time', '2026-10-31T21:00'],
    ['nothing', ''],
  ])('refuses %s (%j)', (_case, text) => {
    expect(() => CalendarDate.parse(text)).toThrow(InvalidCalendarDateError);
  });
});
