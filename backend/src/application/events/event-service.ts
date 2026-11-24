import { Event, type EventDetails } from '../../domain/events/event.ts';
import { inAdminListOrder, upcomingShownToGuests } from '../../domain/events/event-lists.ts';
import type { EventRepository } from '../../domain/events/event-repository.ts';
import { ServiceNight } from '../../domain/shared/service-night.ts';
import type { Clock } from '../ports/clock.ts';
import type { ScheduleProvider } from '../ports/schedule-provider.ts';
import { EventNotFoundError } from './event-errors.ts';

/** An Event as the admin panel lists it: with whether guests see it tonight. */
export interface ListedEvent {
  readonly event: Event;
  readonly upcoming: boolean;
}

/**
 * The use cases for Events, one method each. A service orchestrates: it asks the Clock and the ScheduleProvider for
 * the current ServiceNight, loads and saves through the EventRepository, and leaves every rule to the domain (an
 * Event says whether it is upcoming, event-lists.ts which ones guests see and in what order, and the value objects
 * refuse bad details). It sees ports and domain objects only, never HTTP or MongoDB, which is why the same service
 * would work behind any web framework or database.
 */
export class EventService {
  private readonly events: EventRepository;
  private readonly schedule: ScheduleProvider;
  private readonly clock: Clock;

  constructor(events: EventRepository, schedule: ScheduleProvider, clock: Clock) {
    this.events = events;
    this.schedule = schedule;
    this.clock = clock;
  }

  /** What guests see: the next three upcoming Events, soonest first. */
  async upcomingForGuests(): Promise<Event[]> {
    const serviceNight = await this.currentServiceNight();
    // All of them, filtered in the domain: the bar has a few Events a month, and loading them all keeps the
    // "upcoming" rule in one place, Event.isUpcomingOn, instead of copying it into a database query. If the list ever
    // grows large, the repository is where to narrow it.
    return upcomingShownToGuests(await this.events.findAll(), serviceNight);
  }

  /** What the admin panel lists: every Event, the upcoming ones first (soonest first), then the past ones (latest first). */
  async listForAdmin(): Promise<ListedEvent[]> {
    const serviceNight = await this.currentServiceNight();
    const events = inAdminListOrder(await this.events.findAll(), serviceNight);
    return events.map((event) => listedOn(serviceNight, event));
  }

  async add(details: EventDetails): Promise<ListedEvent> {
    const event = Event.create(details);
    await this.events.save(event);
    return listedOn(await this.currentServiceNight(), event);
  }

  /** Throws EventNotFoundError when there is no Event with that id. */
  async edit(id: string, details: EventDetails): Promise<ListedEvent> {
    const event = await this.events.findById(id);
    if (event === undefined) throw new EventNotFoundError();
    event.edit(details);
    await this.events.save(event);
    return listedOn(await this.currentServiceNight(), event);
  }

  /** Throws EventNotFoundError when there is no Event with that id. */
  async delete(id: string): Promise<void> {
    if (!(await this.events.delete(id))) throw new EventNotFoundError();
  }

  /** The ServiceNight it is now, by the Clock and the bar's hours: the domain decides, the service gathers inputs. */
  private async currentServiceNight(): Promise<ServiceNight> {
    return ServiceNight.at(this.clock.now(), await this.schedule.weeklySchedule());
  }
}

function listedOn(serviceNight: ServiceNight, event: Event): ListedEvent {
  return { event, upcoming: event.isUpcomingOn(serviceNight) };
}
