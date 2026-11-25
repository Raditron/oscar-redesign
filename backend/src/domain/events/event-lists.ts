// Rules about the Events as a whole, which no one Event can answer: which of them guests see, and the order they're
// listed in. In DDD's words, a domain service: plain functions of the Events and the ServiceNight, kept in the
// domain with the bar's other rules. The application service only loads the Events, works out the ServiceNight and
// hands both in.
import { CalendarDate } from '../shared/calendar-date.ts';
import type { ServiceNight } from '../shared/service-night.ts';
import type { Event } from './event.ts';

// The home page has room for three: the section keeps its design however many Events are planned.
const SHOWN_TO_GUESTS = 3;

/** What guests see on `serviceNight`: the three soonest upcoming Events, soonest first. */
export function upcomingShownToGuests(events: readonly Event[], serviceNight: ServiceNight): Event[] {
  return events.filter((event) => event.isUpcomingOn(serviceNight)).sort(soonestFirst).slice(0, SHOWN_TO_GUESTS);
}

/** Every Event in the admin panel's order on `serviceNight`: upcoming ones soonest first, then past ones latest first. */
export function inAdminListOrder(events: readonly Event[], serviceNight: ServiceNight): Event[] {
  const upcoming = events.filter((event) => event.isUpcomingOn(serviceNight)).sort(soonestFirst);
  const past = events.filter((event) => !event.isUpcomingOn(serviceNight)).sort(latestFirst);
  return [...upcoming, ...past];
}

// Both orders are by date, then by id. An Event has no start time, so two on the same date have no order of their
// own, and the repository hands them over in none. Their ids give them one: it means nothing, but it is the same on
// every load, so the three guests see, and the admin panel's list, never change while the Events don't.

function soonestFirst(a: Event, b: Event): number {
  return CalendarDate.compare(a.date, b.date) || byId(a, b);
}

function latestFirst(a: Event, b: Event): number {
  return CalendarDate.compare(b.date, a.date) || byId(a, b);
}

function byId(a: Event, b: Event): number {
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}
