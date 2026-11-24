import { DomainError } from '../shared/domain-error.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';

/** Text that isn't a phone number in international form. */
export class InvalidPhoneNumberError extends DomainError {
  override readonly name = 'InvalidPhoneNumberError';

  constructor(text: string) {
    super(`A phone number starts with + and the country code, then its digits (e.g. "+359 899 666 633"), not "${text}".`);
  }
}

/**
 * A phone number guests can call, in international form, written the way the site shows it: "+359 899 666 633".
 *
 * Why the country code is required: many guests are visitors with foreign phones, and the site turns the number
 * into a `tel:` link (the digits after the +), which dials the bar from anywhere only in international form. How the
 * digits are grouped is kept as written, since that is how guests read it.
 */
export class PhoneNumber {
  private constructor() {}

  /** Refuses with InvalidPhoneNumberError anything that isn't +, the country code and the number's digits. */
  static parse(_text: string): PhoneNumber {
    throw new NotImplementedError('PhoneNumber.parse');
  }

  /** As written: "+359 899 666 633". */
  toString(): string {
    throw new NotImplementedError('PhoneNumber.toString');
  }
}
