// Seam: the domain layer, without HTTP or a database. A ServiceNight is the bar's night, named by the date it opens
// on: a moment after midnight and before the previous day's closing time still belongs to the previous date's.
import { describe, expect, it } from 'vitest';
import { ServiceNight } from '../../src/domain/shared/service-night.ts';
import { DayHours, WeeklySchedule } from '../../src/domain/shared/weekly-schedule.ts';
import { BAR_HOURS, open } from '../support/bar-hours.ts';
import { SERVICE_NIGHT_CASES } from '../support/service-night-cases.ts';

/** The ServiceNight of a moment given as Sofia local time (late November is UTC+2), as YYYY-MM-DD. */
const serviceNightAt = (sofiaTime: string, schedule = BAR_HOURS) =>
  ServiceNight.at(new Date(`${sofiaTime}+02:00`), schedule).date.toString();

describe('ServiceNight', () => {
  it.each(SERVICE_NIGHT_CASES)('puts $when in the ServiceNight of $serviceNight', ({ sofiaTime, serviceNight }) => {
    expect(serviceNightAt(sofiaTime)).toBe(serviceNight);
  });

  it("reads the moment on Sofia's clock, wherever the server runs", () => {
    // Sunday 22:30 in UTC is Monday 00:30 in Sofia: past Sunday's 23:30 close, so Monday's ServiceNight.
    expect(ServiceNight.at(new Date('2026-11-22T22:30:00Z'), BAR_HOURS).date.toString()).toBe('2026-11-23');
  });

  it("follows Sofia's summer time", () => {
    // Sunday 5 July 2026, 01:30 in Sofia, which is UTC+3 in summer
    expect(ServiceNight.at(new Date('2026-07-05T01:30:00+03:00'), BAR_HOURS).date.toString()).toBe('2026-07-04');
  });

  describe('on closed days', () => {
    const SATURDAY_CLOSED = WeeklySchedule.of({
      monday: DayHours.closed(),
      tuesday: open('18:00', '23:30'),
      wednesday: open('18:00', '23:30'),
      thursday: open('18:00', '02:00'),
      friday: open('18:00', '03:00'),
      saturday: DayHours.closed(),
      sunday: open('18:00', '23:30'),
    });

    it('carries nothing past midnight from a closed day: Sunday 01:30 after a closed Saturday is Sunday', () => {
      expect(serviceNightAt('2026-11-22T01:30', SATURDAY_CLOSED)).toBe('2026-11-22');
    });

    it("still carries Friday's ServiceNight into a closed Saturday: Saturday 01:30 is Friday's", () => {
      expect(serviceNightAt('2026-11-21T01:30', SATURDAY_CLOSED)).toBe('2026-11-20');
    });

    it('names a closed day its own ServiceNight all the same: Monday 20:00, closed, is Monday', () => {
      expect(serviceNightAt('2026-11-23T20:00', SATURDAY_CLOSED)).toBe('2026-11-23');
    });
  });

  describe('on a day that closes at exactly midnight', () => {
    const SATURDAY_UNTIL_MIDNIGHT = WeeklySchedule.of({
      monday: open('18:00', '23:30'),
      tuesday: open('18:00', '23:30'),
      wednesday: open('18:00', '23:30'),
      thursday: open('18:00', '02:00'),
      friday: open('18:00', '03:00'),
      saturday: open('18:00', '00:00'),
      sunday: open('18:00', '23:30'),
    });

    it("keeps Saturday 23:59 in Saturday's ServiceNight", () => {
      expect(serviceNightAt('2026-11-21T23:59', SATURDAY_UNTIL_MIDNIGHT)).toBe('2026-11-21');
    });

    it("starts Sunday's at 00:00, Saturday's closing time", () => {
      expect(serviceNightAt('2026-11-22T00:00', SATURDAY_UNTIL_MIDNIGHT)).toBe('2026-11-22');
    });
  });
});
