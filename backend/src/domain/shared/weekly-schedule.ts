import type { Weekday } from './calendar-date.ts';
import { DomainError } from './domain-error.ts';
import type { TimeOfDay } from './time-of-day.ts';

/** Opening and closing times the bar can't keep. */
export class InvalidDayHoursError extends DomainError {
  override readonly name = 'InvalidDayHoursError';

  constructor(time: TimeOfDay) {
    super(`The bar can't open and close at the same time (${time.toString()}): mark the day as closed instead.`);
  }
}

/**
 * One weekday's hours: either closed, or an opening and a closing time. A closing time that comes before the
 * opening time is on the next day: 18:00–03:00 runs past midnight. That is how the bar writes its hours, so it is
 * how they are kept, with no separate "next day" flag to get out of step with the times.
 */
export class DayHours {
  /**
   * Null on a day the bar is closed. The two times are one value, rather than two that could each be null, so a day
   * with an opening time but no closing time can't even be written down.
   */
  readonly times: { readonly opensAt: TimeOfDay; readonly closesAt: TimeOfDay } | null;

  private constructor(times: DayHours['times']) {
    this.times = times;
  }

  static closed(): DayHours {
    return new DayHours(null);
  }

  static open(opensAt: TimeOfDay, closesAt: TimeOfDay): DayHours {
    // Equal times would mean either no time open at all or 24 hours: neither reading is safe to guess.
    if (opensAt.equals(closesAt)) throw new InvalidDayHoursError(opensAt);
    return new DayHours({ opensAt, closesAt });
  }

  /**
   * Whether the bar, open on this day, is still open at `time` on the next day: it closes after midnight, and later
   * than `time`.
   */
  isStillOpenAfterMidnightAt(time: TimeOfDay): boolean {
    if (this.times === null) return false;
    const { opensAt, closesAt } = this.times;
    return closesAt.isBefore(opensAt) && time.isBefore(closesAt);
  }
}

/** The bar's hours for the week: one DayHours for each of the seven weekdays. */
export class WeeklySchedule {
  private readonly days: Readonly<Record<Weekday, DayHours>>;

  private constructor(days: Readonly<Record<Weekday, DayHours>>) {
    this.days = days;
  }

  static of(days: Readonly<Record<Weekday, DayHours>>): WeeklySchedule {
    // No check that all seven days are there: the type asks for them, and the compiler holds every caller to it (a
    // mapper reading the week back from the database included). A factory checks what a type can't say, such as two
    // equal times in DayHours.open, the way an Event trusts the types of its EventDetails.
    // A copy: the caller's object could still be changed after it was handed in.
    return new WeeklySchedule({ ...days });
  }

  hoursOn(weekday: Weekday): DayHours {
    return this.days[weekday];
  }
}
