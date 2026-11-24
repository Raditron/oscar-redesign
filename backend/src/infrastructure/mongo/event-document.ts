import { Event } from '../../domain/events/event.ts';
import { CalendarDate } from '../../domain/shared/calendar-date.ts';
import { DomainError } from '../../domain/shared/domain-error.ts';
import { LocalizedText } from '../../domain/shared/localized-text.ts';
import { Money } from '../../domain/shared/money.ts';

/**
 * How an Event is kept in the `events` collection: plain data that MongoDB can store, query and index.
 *
 * Why a mapper between this and the domain's Event, rather than storing the Event as it is: the two change for
 * different reasons. The document's shape is a storage decision (field names, `_id`, what is indexed); the Event's
 * is a domain decision (what an Admin can change, which rules hold). With the translation in one place, either can
 * change without the other, and no MongoDB detail leaks into the domain.
 */
export interface EventDocument {
  /** The Event's own id: the domain makes it, so MongoDB doesn't need to. */
  readonly _id: string;
  /** YYYY-MM-DD. Text, not a BSON date: a BSON date is an instant, and an instant would put the day at risk of
   * shifting by a time zone. Text in this form also sorts by date. */
  readonly date: string;
  readonly title: { readonly bg: string; readonly en: string };
  /** Whole euro cents, or null for free entry. The unit is in the name, since a number on its own doesn't say it. */
  readonly entryFeeCents: number | null;
}

export function toEventDocument(event: Event): EventDocument {
  return {
    _id: event.id,
    date: event.date.toString(),
    title: { bg: event.title.bg, en: event.title.en },
    entryFeeCents: event.entryFee === null ? null : event.entryFee.cents,
  };
}

/**
 * The way back goes through the same factories as everything else, so a document that breaks a domain rule (edited
 * by hand, or kept from before a rule was tightened) is refused here rather than turned into an Event that can't
 * exist.
 */
export function toEvent(document: EventDocument): Event {
  try {
    return Event.restore(document._id, {
      date: CalendarDate.parse(document.date),
      title: LocalizedText.of(document.title),
      entryFee: document.entryFeeCents === null ? null : Money.ofCents(document.entryFeeCents),
    });
  } catch (error) {
    // A DomainError means "the client sent a value the rules refuse", which the HTTP layer answers with 400. Here
    // the bad value came from the database, so it is rethrown as an unexpected error: logged, and answered 500.
    if (error instanceof DomainError) {
      throw new Error(`The events document ${document._id} breaks a domain rule.`, { cause: error });
    }
    throw error;
  }
}
