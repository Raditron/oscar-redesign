// Seam: the domain layer, without HTTP or a database. A Cocktail's accent colour is one of the design's six drink
// colours, named as their tokens in the site's CSS are (--d-garden → "garden").
import { describe, expect, it } from 'vitest';
import { parseAccentColour, UnknownAccentColourError } from '../../src/domain/cocktails/accent-colour.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('parseAccentColour', () => {
  it.each(['garden', 'curacao', 'berry', 'hibiscus', 'amber', 'champagne'])('knows %s', (text) => {
    expect(parseAccentColour(text)).toBe(text);
  });

  it.each([
    ['a colour the design has no drink token for', 'gold'],
    ['a hex value', '#a9d13b'],
    ['the whole CSS token', '--d-garden'],
    ['capitals', 'Garden'],
    ['nothing', ''],
  ])('refuses %s', (_case, text) => {
    expectRefusal(() => parseAccentColour(text), UnknownAccentColourError);
  });
});
