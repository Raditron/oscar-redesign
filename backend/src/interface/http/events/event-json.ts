import type { ListedEvent } from '../../../application/events/event-service.ts';
import type { Event } from '../../../domain/events/event.ts';

// How Events look on the wire. The HTTP layer decides this, not the domain: a domain object never serialises
// itself, so its fields can change without changing the API, and the API can change without touching the domain.

/** An Event as guests get it from GET /public/events. */
export interface PublicEventJson {
  /** YYYY-MM-DD, the day in Sofia. */
  readonly date: string;
  readonly title: { readonly bg: string; readonly en: string };
  /** Whole euro cents; null for free entry. */
  readonly entryFee: number | null;
}

/** An Event as the admin panel gets it from /admin/events: with its id, and whether guests see it now. */
export interface AdminEventJson extends PublicEventJson {
  readonly id: string;
  readonly upcoming: boolean;
}

export function publicEventJson(event: Event): PublicEventJson {
  return {
    date: event.date.toString(),
    title: { bg: event.title.bg, en: event.title.en },
    entryFee: event.entryFee === null ? null : event.entryFee.cents,
  };
}

export function adminEventJson({ event, upcoming }: ListedEvent): AdminEventJson {
  return { id: event.id, ...publicEventJson(event), upcoming };
}
