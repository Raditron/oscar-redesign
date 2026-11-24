// The bar's hours as the site shows them today, built from domain objects for the domain tests. Written out here
// rather than taken from the backend, so a test's expectations never come from the code it checks.
import { TimeOfDay } from '../../src/domain/shared/time-of-day.ts';
import { DayHours, WeeklySchedule } from '../../src/domain/shared/weekly-schedule.ts';

export const open = (opensAt: string, closesAt: string) => DayHours.open(TimeOfDay.parse(opensAt), TimeOfDay.parse(closesAt));

/** Mon–Wed and Sun 18:00–23:30, Thu until 02:00, Fri–Sat until 03:00. */
export const BAR_HOURS = WeeklySchedule.of({
  monday: open('18:00', '23:30'),
  tuesday: open('18:00', '23:30'),
  wednesday: open('18:00', '23:30'),
  thursday: open('18:00', '02:00'),
  friday: open('18:00', '03:00'),
  saturday: open('18:00', '03:00'),
  sunday: open('18:00', '23:30'),
});
