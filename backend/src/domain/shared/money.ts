import { DomainError } from './domain-error.ts';

/** An amount that can't be Money: below zero, or not a whole number of cents. */
export class InvalidMoneyError extends DomainError {
  override readonly name = 'InvalidMoneyError';

  constructor(cents: number) {
    super(`An amount of money is a whole, non-negative number of euro cents, not ${cents}.`);
  }
}

/**
 * An amount in euro, counted in whole cents and never negative.
 *
 * Why a value object rather than a plain number: a number can be -3, 14.999 or NaN, and every function that takes
 * one would have to check it again. A Money can only be made through `ofCents`, which refuses those, so whoever
 * holds a Money knows it is valid without looking. Whole cents, never floats: 0.1 + 0.2 is not 0.3 in floating point,
 * and a price must add up exactly.
 */
export class Money {
  readonly cents: number;

  // Private: `ofCents` is the one way in, so no Money skips the check.
  private constructor(cents: number) {
    this.cents = cents;
  }

  static ofCents(cents: number): Money {
    // A safe integer is a whole number that a double holds exactly; that also rules out NaN and Infinity.
    if (!Number.isSafeInteger(cents) || cents < 0) throw new InvalidMoneyError(cents);
    return new Money(cents);
  }
}
