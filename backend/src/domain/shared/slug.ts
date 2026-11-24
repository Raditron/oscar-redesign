import { DomainError } from './domain-error.ts';
import { NotImplementedError } from './not-implemented-error.ts';

/** Text that can't be a Slug: capitals, spaces, Cyrillic, a hyphen at either end. */
export class InvalidSlugError extends DomainError {
  override readonly name = 'InvalidSlugError';

  constructor(text: string) {
    super(`A slug is lower-case Latin letters and digits, with single hyphens between them (e.g. "irish-whiskey"), not "${text}".`);
  }
}

/**
 * The short name a Category or a Cocktail goes by in an address: the menu's anchors (`mainmenu/#irish`,
 * `mainmenu/#tarator`) and the home page's links to them. Only lower-case Latin letters, digits and single hyphens
 * between them, so it can be written into a URL and an HTML id as it is.
 *
 * No two of a kind share one (the API answers 409 DUPLICATE_SLUG). That is a rule about many at once, which no one
 * Slug, Category or Cocktail can answer, so it isn't declared here: where it lives is yours to design.
 */
export class Slug {
  private constructor() {}

  /** Refuses with InvalidSlugError any text that isn't a slug. */
  static parse(_text: string): Slug {
    throw new NotImplementedError('Slug.parse');
  }

  equals(_other: Slug): boolean {
    throw new NotImplementedError('Slug.equals');
  }

  toString(): string {
    throw new NotImplementedError('Slug.toString');
  }
}
