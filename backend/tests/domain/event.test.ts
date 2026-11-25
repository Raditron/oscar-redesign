// Seam: the domain layer, without HTTP or a database. An Event is something on at the bar on one date: a date in
// Sofia, a title in both languages, and an entry fee or free entry. It is upcoming when its date is on or after the
// date of the current ServiceNight.
import { describe, expect, it } from 'vitest';
import { Event, type EventDetails } from '../../src/domain/events/event.ts';
import { CalendarDate } from '../../src/domain/shared/calendar-date.ts';
import { LocalizedText } from '../../src/domain/shared/localized-text.ts';
import { Money } from '../../src/domain/shared/money.ts';
import { ServiceNight } from '../../src/domain/shared/service-night.ts';
import { BAR_HOURS } from '../support/bar-hours.ts';

const details = (date: string, entryFee: Money | null = Money.ofCents(1000)): EventDetails => ({
  date: CalendarDate.parse(date),
  title: LocalizedText.of({ bg: 'DISCOCKTAILS · Bo Vinyls на винил', en: 'DISCOCKTAILS · Bo Vinyls on vinyl' }),
  entryFee,
});

/** The ServiceNight of a moment given as Sofia local time (late November is UTC+2). */
const serviceNightAt = (sofiaTime: string) => ServiceNight.at(new Date(`${sofiaTime}+02:00`), BAR_HOURS);

describe('Event', () => {
  describe('is upcoming', () => {
    it("on Saturday at 01:30 on Sunday, since that is still Saturday's ServiceNight", () => {
      const saturday = Event.create(details('2026-11-21'));

      expect(saturday.isUpcomingOn(serviceNightAt('2026-11-22T01:30'))).toBe(true);
    });

    it('on a later date', () => {
      const nextSaturday = Event.create(details('2026-11-28'));

      expect(nextSaturday.isUpcomingOn(serviceNightAt('2026-11-22T01:30'))).toBe(true);
    });

    it('on its own date before the bar opens', () => {
      const saturday = Event.create(details('2026-11-21'));

      expect(saturday.isUpcomingOn(serviceNightAt('2026-11-21T12:00'))).toBe(true);
    });
  });

  describe('is no longer upcoming', () => {
    it("once its ServiceNight has ended: Saturday's at 03:00 on Sunday", () => {
      const saturday = Event.create(details('2026-11-21'));

      expect(saturday.isUpcomingOn(serviceNightAt('2026-11-22T03:00'))).toBe(false);
    });

    it("on Monday at 00:10, after Sunday's 23:30 close", () => {
      const sunday = Event.create(details('2026-11-22'));

      expect(sunday.isUpcomingOn(serviceNightAt('2026-11-23T00:10'))).toBe(false);
    });
  });

  it('keeps its date, title and entry fee', () => {
    const event = Event.create(details('2026-11-07', Money.ofCents(1000)));

    expect(event.date.toString()).toBe('2026-11-07');
    expect(event.title.en).toBe('DISCOCKTAILS · Bo Vinyls on vinyl');
    expect(event.entryFee?.cents).toBe(1000);
  });

  it('allows free entry: no entry fee at all', () => {
    expect(Event.create(details('2026-11-07', null)).entryFee).toBeNull();
  });

  it('keeps an entry fee of 0 € as a fee, apart from free entry', () => {
    expect(Event.create(details('2026-11-07', Money.ofCents(0))).entryFee?.cents).toBe(0);
  });

  it('gets an identity of its own, so two Events with the same details are still two Events', () => {
    const first = Event.create(details('2026-11-07'));
    const second = Event.create(details('2026-11-07'));

    expect(first.id).not.toBe(second.id);
  });

  it('changes its date, title and entry fee when edited, and stays the same Event', () => {
    const event = Event.create(details('2026-11-07', Money.ofCents(1000)));
    const id = event.id;

    event.edit(details('2026-11-14', null));

    expect(event.id).toBe(id);
    expect(event.date.toString()).toBe('2026-11-14');
    expect(event.entryFee).toBeNull();
  });
});
