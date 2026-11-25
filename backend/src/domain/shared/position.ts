import { DomainError } from './domain-error.ts';
import { NotImplementedError } from './not-implemented-error.ts';

/** A number that can't be a Position: below 1, or not a whole number. */
export class InvalidPositionError extends DomainError {
  override readonly name = 'InvalidPositionError';

  constructor(value: number) {
    super(`A position is a whole number from 1 up (1 comes first), not ${value}.`);
  }
}

/**
 * Where a Category stands among the Categories of its Section, or a Cocktail among the Cocktails: the bar's chosen
 * order, lowest first. Counted from 1, the way the bar's staff number things.
 */
export class Position {
  private constructor() {}

  /** Refuses with InvalidPositionError a value below 1 or a fraction. */
  static of(_value: number): Position {
    throw new NotImplementedError('Position.of');
  }

  get value(): number {
    throw new NotImplementedError('Position.value');
  }
}
