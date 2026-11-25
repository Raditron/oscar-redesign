import { NotImplementedError } from '../shared/not-implemented-error.ts';
import type { WeeklySchedule } from '../shared/weekly-schedule.ts';
import type { Contacts } from './contacts.ts';
import type { HappyHour } from './happy-hour.ts';

/** What an Admin says about the VenueSettings: all of it, since it is replaced whole. */
export interface VenueSettingsDetails {
  readonly weeklySchedule: WeeklySchedule;
  readonly happyHour: HappyHour;
  readonly contacts: Contacts;
}

/**
 * The bar's own details that the site shows: its WeeklySchedule, HappyHour and Contacts. There is exactly one.
 *
 * An aggregate, and a singleton: there is no second VenueSettings to tell it apart from, so it needs no id, and an
 * Admin's save replaces it whole. Its WeeklySchedule is also what decides the current ServiceNight, so it is what
 * makes an Event upcoming or past (see the ScheduleProvider port).
 *
 * Why `of` rather than an Event's `create`, `restore` and `edit`: those exist to keep an identity across changes, and
 * this has none to keep. Every save is a whole new VenueSettings, built and checked like a value object, that takes
 * the old one's place; nothing is changed in place, so there is no method to change it.
 */
export class VenueSettings {
  private constructor() {}

  static of(_details: VenueSettingsDetails): VenueSettings {
    throw new NotImplementedError('VenueSettings.of');
  }

  get weeklySchedule(): WeeklySchedule {
    throw new NotImplementedError('VenueSettings.weeklySchedule');
  }

  get happyHour(): HappyHour {
    throw new NotImplementedError('VenueSettings.happyHour');
  }

  get contacts(): Contacts {
    throw new NotImplementedError('VenueSettings.contacts');
  }
}
