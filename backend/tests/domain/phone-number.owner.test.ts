// Seam: the domain layer, without HTTP or a database. A PhoneNumber is one guests can call from anywhere: in
// international form, + and the country code first, because the site makes a `tel:` link of it. Its digits are kept
// grouped as written.
import { describe, expect, it } from 'vitest';
import { InvalidPhoneNumberError, PhoneNumber } from '../../src/domain/venue-settings/phone-number.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('PhoneNumber', () => {
  it.each(['+359 899 666 633', '+359 883 30 50 55', '+359899666633'])('keeps %s as written', (text) => {
    expect(PhoneNumber.parse(text).toString()).toBe(text);
  });

  it.each([
    ['a number without the country code', '0899 666 633'],
    ['a country code without the +', '359 899 666 633'],
    ['words', 'call us'],
    ['a letter among the digits', '+359 899 666 63a'],
    ['nothing', ''],
  ])('refuses %s', (_case, text) => {
    expectRefusal(() => PhoneNumber.parse(text), InvalidPhoneNumberError);
  });
});
