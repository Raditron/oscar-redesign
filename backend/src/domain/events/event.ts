import type { CalendarDate } from '../shared/calendar-date.ts';
import type { LocalizedText } from '../shared/localized-text.ts';
import type { Money } from '../shared/money.ts';
import type { ServiceNight } from '../shared/service-night.ts';

/** What an Admin says about an Event: everything but its identity. */
export interface EventDetails {
  /** The day in Sofia whose ServiceNight the Event is on. */
  readonly date: CalendarDate;
  readonly title: LocalizedText;
  /** Null for free entry. A fee of 0 € is still a fee: kept as given, never turned into free entry. */
  readonly entryFee: Money | null;
}

/**
 * Something on at the bar on one date, such as a DJ. Guests see the three soonest upcoming ones on the home page.
 *
 * The aggregate boundary: an Event is an aggregate on its own. Nothing else has to change when it changes, and
 * nothing inside it has an identity of its own (its date, title and fee are value objects), so it is loaded, edited
 * and saved whole, by its id, through the EventRepository. Its invariants live in those value objects: an Event
 * built from them can't have a blank title or a negative fee, so it needs no checks of its own. Rules about many
 * Events at once (which ones guests see, and in what order) are in event-lists.ts.
 *
 * An entity, not a value object: two Events with the same date and title are still two Events, and an Event stays
 * the same Event when an Admin edits it. Its id says which one it is.
 */
export class Event {
  readonly id: string;
  // Private, so the details change only through edit().
  private details: EventDetails;

  private constructor(id: string, details: EventDetails) {
    this.id = id;
    this.details = details;
  }

  /**
   * A new Event, with an identity of its own from the moment it exists. The id is made here, not by the database,
   * so an Event never exists without one, and no layer has to wait for a save to know which Event it holds.
   */
  static create(details: EventDetails): Event {
    // A random UUID, from the Web Crypto API every JavaScript runtime provides: no import, no library. Unlike "now",
    // it needs no port: no rule depends on an id's value, so no test ever needs to choose one.
    return new Event(crypto.randomUUID(), details);
  }

  /** An Event that already exists, as the repository loads it back. */
  static restore(id: string, details: EventDetails): Event {
    return new Event(id, details);
  }

  get date(): CalendarDate {
    return this.details.date;
  }

  get title(): LocalizedText {
    return this.details.title;
  }

  get entryFee(): Money | null {
    return this.details.entryFee;
  }

  edit(details: EventDetails): void {
    this.details = details;
  }

  /**
   * Whether it is upcoming: its date is on or after the date of `serviceNight`. A Saturday's Event stays upcoming until
   * Saturday's ServiceNight ends, past midnight, not at midnight. (Guests see at most three upcoming Events, so being
   * upcoming makes an Event one guests may see, not one they do: see event-lists.ts.)
   */
  isUpcomingOn(serviceNight: ServiceNight): boolean {
    return !this.date.isBefore(serviceNight.date);
  }
}
