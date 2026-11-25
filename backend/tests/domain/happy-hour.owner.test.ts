// Seam: the domain layer, without HTTP or a database. The HappyHour is the daily window when drinks are discounted:
// from one time to a later one on the same evening, with a whole percentage from 1 to 100 off.
import { describe, expect, it } from 'vitest';
import { TimeOfDay } from '../../src/domain/shared/time-of-day.ts';
import { HappyHour, InvalidDiscountPercentError, InvalidHappyHourTimesError } from '../../src/domain/venue-settings/happy-hour.ts';
import { expectRefusal } from '../support/expect-refusal.ts';

const happyHour = (from: string, to: string, discountPercent: number) =>
  HappyHour.of({ from: TimeOfDay.parse(from), to: TimeOfDay.parse(to), discountPercent });

describe('HappyHour', () => {
  it('keeps its times and its discount: 50 % off from 18:00 to 20:00', () => {
    const tonight = happyHour('18:00', '20:00', 50);

    expect(tonight.from.toString()).toBe('18:00');
    expect(tonight.to.toString()).toBe('20:00');
    expect(tonight.discountPercent).toBe(50);
  });

  it.each([1, 100])('allows a discount of %i %', (percent) => {
    expect(happyHour('18:00', '20:00', percent).discountPercent).toBe(percent);
  });

  it.each([
    ['nothing off', 0],
    ['more than everything off', 101],
    ['a negative discount', -10],
    ['a fraction of a percent', 12.5],
    ['not a number', Number.NaN],
  ])('refuses %s', (_case, percent) => {
    expectRefusal(() => happyHour('18:00', '20:00', percent), InvalidDiscountPercentError);
  });

  it('refuses a window that ends before it starts', () => {
    expectRefusal(() => happyHour('20:00', '18:00', 50), InvalidHappyHourTimesError);
  });

  it('refuses a window that ends when it starts', () => {
    expectRefusal(() => happyHour('18:00', '18:00', 50), InvalidHappyHourTimesError);
  });

  it('refuses a window across midnight, which the open-now line could never show', () => {
    expectRefusal(() => happyHour('23:00', '01:00', 50), InvalidHappyHourTimesError);
  });
});
