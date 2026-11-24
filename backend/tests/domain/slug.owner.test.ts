// Seam: the domain layer, without HTTP or a database. A Slug is the short name a Category or a Cocktail goes by in
// the menu's anchors and links: lower-case Latin letters and digits, with single hyphens between them. (That no
// two of a kind share one is checked at the API, by the 409 tests of the Categories and the Cocktails.)
import { describe, expect, it } from 'vitest';
import { InvalidSlugError, Slug } from '../../src/domain/shared/slug.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('Slug', () => {
  it.each(['tarator', 'french69', 'irish-whiskey', '69'])('keeps %s', (text) => {
    expect(Slug.parse(text).toString()).toBe(text);
  });

  it.each([
    ['capitals', 'Tarator'],
    ['a space', 'irish whiskey'],
    ['Cyrillic', 'водка'],
    ['an accented letter', 'espolòn'],
    ['a hyphen at the start', '-tarator'],
    ['a hyphen at the end', 'tarator-'],
    ['two hyphens in a row', 'irish--whiskey'],
    ['an underscore', 'irish_whiskey'],
    ['nothing', ''],
  ])('refuses %s', (_case, text) => {
    expectRefusal(() => Slug.parse(text), InvalidSlugError);
  });

  it('equals another Slug with the same text, and only that', () => {
    expect(Slug.parse('tarator').equals(Slug.parse('tarator'))).toBe(true);
    expect(Slug.parse('tarator').equals(Slug.parse('machree'))).toBe(false);
  });
});
