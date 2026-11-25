import { DomainError } from '../shared/domain-error.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';

/** Text that isn't a link to a web page. */
export class InvalidWebLinkError extends DomainError {
  override readonly name = 'InvalidWebLinkError';

  constructor(text: string) {
    super(`A link starts with https:// or http://, e.g. "https://www.facebook.com/OscarClub.sf", not "${text}".`);
  }
}

/**
 * A link to a web page the site sends guests to, such as the bar's Facebook page or its directions on Google Maps:
 * "https://www.facebook.com/OscarClub.sf".
 *
 * Why only http and https: the site writes it into an `<a href>`, where a `javascript:` link would run on the bar's
 * own page, and a link without its scheme would lead to a page of the site that doesn't exist. Where it leads is
 * the Admin's business.
 */
export class WebLink {
  private constructor() {}

  /** Refuses with InvalidWebLinkError anything that isn't a whole link starting with http:// or https://. */
  static parse(_text: string): WebLink {
    throw new NotImplementedError('WebLink.parse');
  }

  /** As written. */
  toString(): string {
    throw new NotImplementedError('WebLink.toString');
  }
}
