import { DomainError } from '../shared/domain-error.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';

/** Text that isn't an email address. */
export class InvalidEmailAddressError extends DomainError {
  override readonly name = 'InvalidEmailAddressError';

  constructor(text: string) {
    super(`An email address is written name@domain, e.g. "events@oscarclubsofia.com", not "${text}".`);
  }
}

/** An email address guests can write to, such as the events email: "events@oscarclubsofia.com". */
export class EmailAddress {
  private constructor() {}

  /** Refuses with InvalidEmailAddressError text that isn't a name, an @ and a domain, with no spaces. */
  static parse(_text: string): EmailAddress {
    throw new NotImplementedError('EmailAddress.parse');
  }

  toString(): string {
    throw new NotImplementedError('EmailAddress.toString');
  }
}
