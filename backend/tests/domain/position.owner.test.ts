// Seam: the domain layer, without HTTP or a database. A Position is where a Category stands in its Section, or a
// Cocktail among the Cocktails: a whole number from 1, lowest first.
import { describe, expect, it } from 'vitest';
import { InvalidPositionError, Position } from '../../src/domain/shared/position.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

describe('Position', () => {
  it.each([1, 13])('keeps %i', (value) => {
    expect(Position.of(value).value).toBe(value);
  });

  it.each([
    ['0', 0],
    ['a negative number', -1],
    ['a fraction', 1.5],
    ['not a number', Number.NaN],
  ])('refuses %s', (_case, value) => {
    expectRefusal(() => Position.of(value), InvalidPositionError);
  });
});
