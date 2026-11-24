// Seam: the domain layer, without HTTP or a database. A Volume is how much a Cocktail holds, in whole millilitres.
import { describe, expect, it } from 'vitest';
import { InvalidVolumeError, Volume } from '../../src/domain/cocktails/volume.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('Volume', () => {
  it.each([175, 280, 330])('keeps %i ml', (millilitres) => {
    expect(Volume.ofMillilitres(millilitres).millilitres).toBe(millilitres);
  });

  it.each([
    ['no volume at all', 0],
    ['a negative volume', -280],
    ['a fraction of a millilitre', 280.5],
    ['not a number', Number.NaN],
  ])('refuses %s', (_case, millilitres) => {
    expectRefusal(() => Volume.ofMillilitres(millilitres), InvalidVolumeError);
  });
});
