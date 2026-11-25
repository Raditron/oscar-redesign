// Seam: the domain layer, without HTTP or a database. A TimeOfDay is a time on the bar's wall clock, to the minute,
// written HH:MM on a 24-hour clock: what it allows and what it refuses.
import { describe, expect, it } from 'vitest';
import { InvalidTimeOfDayError, TimeOfDay } from '../../src/domain/shared/time-of-day.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('a time of day', () => {
  it.each(['00:00', '18:00', '23:59'])('allows %s', (text) => {
    expect(TimeOfDay.parse(text).toString()).toBe(text);
  });

  it.each(['24:00', '18:60', '7:00', '18.00', '1800', '', ' 18:00'])('refuses %j', (text) => {
    expectRefusal(() => TimeOfDay.parse(text), InvalidTimeOfDayError);
  });
});
