import type { LocalizedText } from '../shared/localized-text.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';
import type { EmailAddress } from './email-address.ts';
import type { InstagramHandle } from './instagram-handle.ts';
import type { PhoneNumber } from './phone-number.ts';

/** What an Admin says about the Contacts. */
export interface ContactsDetails {
  readonly reservationPhone: PhoneNumber;
  readonly eventsEmail: EmailAddress;
  readonly eventsPhone: PhoneNumber;
  /** The street address, in both languages: "ул. „Славянска“ 15, 1000 София" / "15 Slavyanska St, 1000 Sofia". */
  readonly address: LocalizedText;
  readonly instagramHandle: InstagramHandle;
}

/**
 * How guests reach the bar: the reservation phone, the events email and phone, the address in both languages, and
 * the Instagram handle. Every place on the site that shows one of them reads it from here.
 *
 * Like an Event, its rules live in its parts: each is a value object that has already refused what it can't be.
 */
export class Contacts {
  private constructor() {}

  static of(_details: ContactsDetails): Contacts {
    throw new NotImplementedError('Contacts.of');
  }

  get reservationPhone(): PhoneNumber {
    throw new NotImplementedError('Contacts.reservationPhone');
  }

  get eventsEmail(): EmailAddress {
    throw new NotImplementedError('Contacts.eventsEmail');
  }

  get eventsPhone(): PhoneNumber {
    throw new NotImplementedError('Contacts.eventsPhone');
  }

  get address(): LocalizedText {
    throw new NotImplementedError('Contacts.address');
  }

  get instagramHandle(): InstagramHandle {
    throw new NotImplementedError('Contacts.instagramHandle');
  }
}
