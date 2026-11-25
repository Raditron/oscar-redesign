// Seam: the domain layer, without HTTP or a database. A Cocktail's base spirit comes from a fixed list, the one the
// menu's filter chips are built on.
import { describe, expect, it } from 'vitest';
import { parseBaseSpirit, UnknownBaseSpiritError } from '../../src/domain/cocktails/base-spirit.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('parseBaseSpirit', () => {
  it.each(['vodka', 'whiskey', 'rum', 'tequila', 'gin', 'cognac', 'soju'])('knows %s', (text) => {
    expect(parseBaseSpirit(text)).toBe(text);
  });

  it.each([
    ['a spirit the list does not have', 'beer'],
    ['the Scotch spelling, which the filter does not use', 'whisky'],
    ['capitals', 'Vodka'],
    ['Bulgarian', 'водка'],
    ['nothing', ''],
  ])('refuses %s', (_case, text) => {
    expectRefusal(() => parseBaseSpirit(text), UnknownBaseSpiritError);
  });
});
