// Seam: the domain layer, without HTTP or a database. A WeeklySchedule and its parts, each weekday's DayHours: what
// they allow and what they refuse.
import { describe, expect, it } from 'vitest';
import { TimeOfDay } from '../../src/domain/shared/time-of-day.ts';
import { DayHours, InvalidDayHoursError, WeeklySchedule } from '../../src/domain/shared/weekly-schedule.ts';
import { open } from '../support/bar-hours.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('WeeklySchedule', () => {
  it('holds hours for all seven days, closed ones included', () => {
    const week = WeeklySchedule.of({
      monday: open('18:00', '23:30'),
      tuesday: open('18:00', '23:30'),
      wednesday: open('18:00', '23:30'),
      thursday: open('18:00', '02:00'),
      friday: open('18:00', '03:00'),
      saturday: open('18:00', '03:00'),
      sunday: DayHours.closed(),
    });

    expect(week.hoursOn('sunday').times).toBeNull();
    expect(week.hoursOn('friday').times?.closesAt.toString()).toBe('03:00');
  });
});

describe('DayHours', () => {
  const time = TimeOfDay.parse;

  it('allows hours that close before midnight', () => {
    expect(DayHours.open(time('18:00'), time('23:30')).times?.closesAt.toString()).toBe('23:30');
  });

  it('allows hours that close after midnight, written as the earlier time', () => {
    const friday = DayHours.open(time('18:00'), time('03:00'));

    expect(friday.times?.opensAt.toString()).toBe('18:00');
    expect(friday.times?.closesAt.toString()).toBe('03:00');
  });

  it('allows a closed day, with no times', () => {
    expect(DayHours.closed().times).toBeNull();
  });

  it('refuses hours that open and close at the same time', () => {
    expectRefusal(() => DayHours.open(time('18:00'), time('18:00')), InvalidDayHoursError);
  });
});
