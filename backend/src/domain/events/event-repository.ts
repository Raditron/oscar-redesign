import type { Event } from './event.ts';

/**
 * The collection of every Event, past and upcoming. An interface, declared here in the domain beside its aggregate:
 * "all the Events there are" is a domain idea, and the application service needs nothing more. How they're kept
 * (MongoDB today) is infrastructure's business, behind this interface, so no other layer ever sees a document or a
 * query.
 *
 * It loads and saves whole Events, never parts of one: the aggregate is the unit of change.
 */
export interface EventRepository {
  /** Every Event, in no particular order. */
  findAll(): Promise<Event[]>;
  /** The Event with that id, or undefined when there is none. */
  findById(id: string): Promise<Event | undefined>;
  /** Stores the Event as it is now: added when it is new, replaced when it isn't. The last save wins. */
  save(event: Event): Promise<void>;
  /** Removes the Event with that id; false when there was none. */
  delete(id: string): Promise<boolean>;
}
