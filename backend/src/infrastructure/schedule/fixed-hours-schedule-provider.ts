import type { ScheduleProvider } from '../../application/ports/schedule-provider.ts';
import { TimeOfDay } from '../../domain/shared/time-of-day.ts';
import { DayHours, WeeklySchedule } from '../../domain/shared/weekly-schedule.ts';

const open = (opensAt: string, closesAt: string) => DayHours.open(TimeOfDay.parse(opensAt), TimeOfDay.parse(closesAt));

/**
 * The bar's hours as the site shows them today: Mon–Wed and Sun 18:00–23:30, Thu until 02:00, Fri–Sat until 03:00.
 * Taken from `OC.hours` in the site's js/main.js, which the open-now line runs on; the hours table and the
 * opening-hours JSON-LD in index.html and en/index.html say the same.
 */
const SITE_HOURS = WeeklySchedule.of({
  monday: open('18:00', '23:30'),
  tuesday: open('18:00', '23:30'),
  wednesday: open('18:00', '23:30'),
  thursday: open('18:00', '02:00'),
  friday: open('18:00', '03:00'),
  saturday: open('18:00', '03:00'),
  sunday: open('18:00', '23:30'),
});

/**
 * Adapter, temporary: the ScheduleProvider port, answered with the hours the site shows today, which no one can
 * change without a deploy. It stands in until the VenueSettings slice keeps the hours in the database, where an
 * Admin edits them; that slice brings an adapter reading them from there, and the composition root swaps this one
 * out.
 */
export class FixedHoursScheduleProvider implements ScheduleProvider {
  async weeklySchedule(): Promise<WeeklySchedule> {
    return SITE_HOURS;
  }
}
