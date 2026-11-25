// Seam: the domain layer, without HTTP or a database. An EmailAddress is one guests can write to: a name, an @ and
// a domain.
import { describe, expect, it } from 'vitest';
import { EmailAddress, InvalidEmailAddressError } from '../../src/domain/venue-settings/email-address.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('EmailAddress', () => {
  it.each(['events@oscarclubsofia.com', 'oscarclub.sf@gmail.com'])('keeps %s', (text) => {
    expect(EmailAddress.parse(text).toString()).toBe(text);
  });

  it.each([
    ['no @', 'events.oscarclubsofia.com'],
    ['no name before the @', '@oscarclubsofia.com'],
    ['no domain after the @', 'events@'],
    ['a space inside', 'events @oscarclubsofia.com'],
    ['two @', 'events@@oscarclubsofia.com'],
    ['nothing', ''],
  ])('refuses %s', (_case, text) => {
    expectRefusal(() => EmailAddress.parse(text), InvalidEmailAddressError);
  });
});
