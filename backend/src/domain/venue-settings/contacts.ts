import type { LocalizedText } from '../shared/localized-text.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';
import type { EmailAddress } from './email-address.ts';
import type { InstagramHandle } from './instagram-handle.ts';
import type { PhoneNumber } from './phone-number.ts';
import type { WebLink } from './web-link.ts';

/** What an Admin says about the Contacts. */
export interface ContactsDetails {
  readonly reservationPhone: PhoneNumber;
  /** The bar's own email, for anything that isn't an event: "oscarclub.sf@gmail.com". */
  readonly generalEmail: EmailAddress;
  readonly eventsEmail: EmailAddress;
  readonly eventsPhone: PhoneNumber;
  /** The street address, in both languages: "ул. „Славянска“ 15, 1000 София" / "15 Slavyanska St, 1000 Sofia". */
  readonly address: LocalizedText;
  /** The link to the bar's directions, behind every "Directions" button: a Google Maps link. */
  readonly mapsUrl: WebLink;
  readonly instagramHandle: InstagramHandle;
  /** The bar's Facebook page: "https://www.facebook.com/OscarClub.sf". */
  readonly facebookUrl: WebLink;
}

/**
 * How guests reach the bar: the reservation phone, the general email, the events email and phone, the address in
 * both languages with the link to its directions, the Instagram handle and the Facebook page. Every place on the site
 * that shows one of them reads it from here.
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

  get generalEmail(): EmailAddress {
    throw new NotImplementedError('Contacts.generalEmail');
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

  get mapsUrl(): WebLink {
    throw new NotImplementedError('Contacts.mapsUrl');
  }

  get instagramHandle(): InstagramHandle {
    throw new NotImplementedError('Contacts.instagramHandle');
  }

  get facebookUrl(): WebLink {
    throw new NotImplementedError('Contacts.facebookUrl');
  }
}
