import type { WeeklySchedule } from '../../domain/shared/weekly-schedule.ts';

/**
 * Port: "what are the bar's hours this week?". Which Events are upcoming depends on when the current ServiceNight
 * ends, so the event service needs the WeeklySchedule, but where it comes from isn't its business.
 *
 * Why a port: the hours belong to VenueSettings, which an Admin edits and the database keeps. Written against what
 * the use case needs rather than against where the hours are kept, the service stays the same whichever adapter
 * answers (see FixedHoursScheduleProvider for the one in use today).
 */
export interface ScheduleProvider {
  weeklySchedule(): Promise<WeeklySchedule>;
}
