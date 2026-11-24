import { BAR_TIME_ZONE } from './bar-time-zone.ts';
import { CalendarDate } from './calendar-date.ts';
import { TimeOfDay } from './time-of-day.ts';
import type { WeeklySchedule } from './weekly-schedule.ts';

/**
 * The bar's night, named by the date it opens on. A moment belongs to the ServiceNight of its own date, except a
 * moment after midnight and before the previous day's closing time, which still belongs to the previous date's: at
 * 01:30 on a Sunday, it is still Saturday's ServiceNight.
 *
 * It decides which Events are upcoming. The site's open-now line follows the same rule in the browser (js/main.js,
 * OC.nightOf), a copy kept on purpose so the line can change without asking the server.
 */
export class ServiceNight {
  readonly date: CalendarDate;

  private constructor(date: CalendarDate) {
    this.date = date;
  }

  /**
   * The ServiceNight `instant` belongs to, by the bar's `schedule`. Both come in as arguments, so the rule never
   * reads a clock or a database: the same arguments always give the same ServiceNight.
   */
  static at(instant: Date, schedule: WeeklySchedule): ServiceNight {
    const { date, time } = barLocalTime(instant);
    const dayBefore = date.previousDay();
    const dayBeforeStillOpen = schedule.hoursOn(dayBefore.weekday).isStillOpenAfterMidnightAt(time);
    return new ServiceNight(dayBeforeStillOpen ? dayBefore : date);
  }
}

// Reads an instant given to it as the bar's date and time; it never asks for "now". Each part is read by its type,
// so their order doesn't matter, only their digits: an English locale writes plain 0–9 with the two-digit padding
// asked for below. h23 counts midnight as 00, never 24.
const IN_BAR_TIME_ZONE = new Intl.DateTimeFormat('en-GB', {
  timeZone: BAR_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** The date and the time on the bar's wall clock at `instant`, daylight saving included. */
function barLocalTime(instant: Date): { date: CalendarDate; time: TimeOfDay } {
  const part = Object.fromEntries(IN_BAR_TIME_ZONE.formatToParts(instant).map(({ type, value }) => [type, value]));
  return {
    date: CalendarDate.parse(`${part.year}-${part.month}-${part.day}`),
    time: TimeOfDay.parse(`${part.hour}:${part.minute}`),
  };
}
