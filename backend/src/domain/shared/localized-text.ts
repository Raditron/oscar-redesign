import { DomainError } from './domain-error.ts';

const LANGUAGE_NAMES = { bg: 'Bulgarian', en: 'English' } as const;

/**
 * A LocalizedText written out as plain data, `{ bg, en }`: what `LocalizedText.of` checks, and how the outer layers
 * write one down (the API's JSON, a database document). A LocalizedText is one too, once checked.
 */
export interface PlainLocalizedText {
  readonly bg: string;
  readonly en: string;
}

/** One of the two languages of a LocalizedText is missing. */
export class BlankTextError extends DomainError {
  override readonly name = 'BlankTextError';

  constructor(language: keyof typeof LANGUAGE_NAMES) {
    super(`Text on the site is written in Bulgarian and English, and the ${LANGUAGE_NAMES[language]} text is blank.`);
  }
}

/**
 * A piece of text in both of the site's languages, Bulgarian and English, neither of them blank.
 *
 * Why one value object for the pair, rather than two strings: the site shows every text in both languages, so the
 * two belong together. Kept as a pair, a text can't exist in one language only, and "both are required" is checked
 * here, once, for every title, name and note in the domain.
 */
export class LocalizedText {
  readonly bg: string;
  readonly en: string;

  private constructor(bg: string, en: string) {
    this.bg = bg;
    this.en = en;
  }

  static of(texts: PlainLocalizedText): LocalizedText {
    // Spaces at either end are never meant (they come with copy and paste) and would make "  " look like a text.
    const bg = texts.bg.trim();
    const en = texts.en.trim();
    if (bg === '') throw new BlankTextError('bg');
    if (en === '') throw new BlankTextError('en');
    return new LocalizedText(bg, en);
  }
}
