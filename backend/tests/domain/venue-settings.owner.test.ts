// Seam: the domain layer, without HTTP or a database. The VenueSettings are the bar's own details: its
// WeeklySchedule, its HappyHour and its Contacts, of which there is exactly one set. Each part refuses what it can't
// be on its own (see their own tests); these check what the whole keeps.
import { describe, expect, it } from 'vitest';
import { LocalizedText } from '../../src/domain/shared/localized-text.ts';
import { TimeOfDay } from '../../src/domain/shared/time-of-day.ts';
import { Contacts } from '../../src/domain/venue-settings/contacts.ts';
import { EmailAddress } from '../../src/domain/venue-settings/email-address.ts';
import { HappyHour } from '../../src/domain/venue-settings/happy-hour.ts';
import { InstagramHandle } from '../../src/domain/venue-settings/instagram-handle.ts';
import { PhoneNumber } from '../../src/domain/venue-settings/phone-number.ts';
import { VenueSettings } from '../../src/domain/venue-settings/venue-settings.ts';
import { BAR_HOURS } from '../support/bar-hours.ts';

const siteContacts = () =>
  Contacts.of({
    reservationPhone: PhoneNumber.parse('+359 899 666 633'),
    eventsEmail: EmailAddress.parse('events@oscarclubsofia.com'),
    eventsPhone: PhoneNumber.parse('+359 883 30 50 55'),
    address: LocalizedText.of({ bg: 'ул. „Славянска“ 15, 1000 София', en: '15 Slavyanska St, 1000 Sofia' }),
    instagramHandle: InstagramHandle.parse('oscarclub_official'),
  });

const siteHappyHour = () => HappyHour.of({ from: TimeOfDay.parse('18:00'), to: TimeOfDay.parse('20:00'), discountPercent: 50 });

describe('Contacts', () => {
  it('keeps the reservation phone, the events email and phone, the address in both languages and the Instagram handle', () => {
    const contacts = siteContacts();

    expect(contacts.reservationPhone.toString()).toBe('+359 899 666 633');
    expect(contacts.eventsEmail.toString()).toBe('events@oscarclubsofia.com');
    expect(contacts.eventsPhone.toString()).toBe('+359 883 30 50 55');
    expect(contacts.address.en).toBe('15 Slavyanska St, 1000 Sofia');
    expect(contacts.instagramHandle.toString()).toBe('oscarclub_official');
  });
});

describe('VenueSettings', () => {
  it('keeps the WeeklySchedule, the HappyHour and the Contacts', () => {
    const settings = VenueSettings.of({ weeklySchedule: BAR_HOURS, happyHour: siteHappyHour(), contacts: siteContacts() });

    expect(settings.weeklySchedule.hoursOn('saturday').times?.closesAt.toString()).toBe('03:00');
    expect(settings.happyHour.discountPercent).toBe(50);
    expect(settings.contacts.instagramHandle.toString()).toBe('oscarclub_official');
  });
});
