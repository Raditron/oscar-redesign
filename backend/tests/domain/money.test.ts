// Seam: the domain layer, without HTTP or a database. Money is an amount in euro, counted in whole cents and never
// negative: what it allows and what it refuses.
import { describe, expect, it } from 'vitest';
import { InvalidMoneyError, Money } from '../../src/domain/shared/money.ts';

describe('Money', () => {
  it('holds an amount in whole euro cents', () => {
    expect(Money.ofCents(1500).cents).toBe(1500);
  });

  it('allows zero', () => {
    expect(Money.ofCents(0).cents).toBe(0);
  });

  it('refuses a negative amount', () => {
    expect(() => Money.ofCents(-1)).toThrow(InvalidMoneyError);
  });

  it.each([
    ['a fraction of a cent', 1499.5],
    ['not a number', Number.NaN],
    ['infinity', Number.POSITIVE_INFINITY],
    ['more cents than can be counted exactly', Number.MAX_SAFE_INTEGER + 1],
  ])('refuses %s', (_case, cents) => {
    expect(() => Money.ofCents(cents)).toThrow(InvalidMoneyError);
  });
});
