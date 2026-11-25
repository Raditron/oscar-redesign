// The bar's hours as the site shows them today (Mon–Wed and Sun 18:00–23:30, Thu until 02:00, Fri–Sat until 03:00):
// built from domain objects for the domain tests, and given to a test backend for the Events tests that depend on
// them. Written out here rather than taken from the backend, so a test's expectations never come from the code it
// checks.
import { TimeOfDay } from '../../src/domain/shared/time-of-day.ts';
import { DayHours, WeeklySchedule } from '../../src/domain/shared/weekly-schedule.ts';
import type { TestApi } from './test-backend.ts';

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

/**
 * Gives the backend the bar's hours, for a test whose Events depend on them (Saturday's Event still upcoming at 01:30
 * on Sunday, until 03:00). Every Events test that depends on the hours calls it, and only those.
 *
 * Today it does nothing: the temporary FixedHoursScheduleProvider already answers with these hours. #36 replaces that
 * adapter with the VenueSettings an Admin saves, and a backend with none has no hours at all; #36 then makes this save
 * the bar's hours as VenueSettings through the admin API (saveVenueSettings(api, SITE_VENUE_SETTINGS), from
 * venue-settings.ts), so the Events test files themselves stay unchanged. The owner's tests never call it: they mean
 * to meet a backend with no VenueSettings, or to save hours of their own.
 */
export async function givenBarHours(_api: TestApi): Promise<void> {}
