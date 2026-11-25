import { DomainError } from '../shared/domain-error.ts';
import { NotImplementedError } from '../shared/not-implemented-error.ts';
import type { TimeOfDay } from '../shared/time-of-day.ts';

/** A discount that isn't a whole percentage from 1 to 100. */
export class InvalidDiscountPercentError extends DomainError {
  override readonly name = 'InvalidDiscountPercentError';

  constructor(percent: number) {
    super(`A happy hour discount is a whole percentage from 1 to 100, not ${percent}.`);
  }
}

/** A HappyHour that doesn't start before it ends. */
export class InvalidHappyHourTimesError extends DomainError {
  override readonly name = 'InvalidHappyHourTimesError';

  constructor(from: TimeOfDay, to: TimeOfDay) {
    super(`Happy hour must start before it ends, on the same evening, not from ${from.toString()} to ${to.toString()}.`);
  }
}

/** What an Admin says about the HappyHour. */
export interface HappyHourDetails {
  readonly from: TimeOfDay;
  readonly to: TimeOfDay;
  /** 50 for 50 % off. */
  readonly discountPercent: number;
}

/**
 * The daily window, from one time to another, when drinks are discounted, with the discount as a percentage from 1
 * to 100. Every evening the same.
 *
 * It starts before it ends on the same evening, never across midnight: the site's open-now line reads it that way
 * (js/main.js, OC.status, compares the minutes since that evening's midnight), so a window across midnight would
 * never show there.
 */
export class HappyHour {
  private constructor() {}

  /**
   * Refuses with InvalidDiscountPercentError a discount that isn't a whole number from 1 to 100, and with
   * InvalidHappyHourTimesError a `from` that isn't before `to`.
   */
  static of(_details: HappyHourDetails): HappyHour {
    throw new NotImplementedError('HappyHour.of');
  }

  get from(): TimeOfDay {
    throw new NotImplementedError('HappyHour.from');
  }

  get to(): TimeOfDay {
    throw new NotImplementedError('HappyHour.to');
  }

  get discountPercent(): number {
    throw new NotImplementedError('HappyHour.discountPercent');
  }
}
