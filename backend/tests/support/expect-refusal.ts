import { expect } from 'vitest';
import type { DomainError } from '../../src/domain/shared/domain-error.ts';

/**
 * Expects `act` to be refused by one rule of the bar: to throw `refusal`, a DomainError of its own.
 *
 * Why not `expect(act).toThrow(refusal)`: when `act` throws something else, that fails with only "expected error to
 * be instance of InvalidSlugError", without saying what was thrown instead. Here anything else is thrown on as it
 * is, so the test fails naming it: another rule's refusal, a TypeError, or, until the owner writes the rule, the
 * NotImplementedError of its declaration.
 */
export function expectRefusal(act: () => unknown, refusal: abstract new (...args: never[]) => DomainError): void {
  try {
    act();
  } catch (error) {
    if (error instanceof refusal) return;
    throw error;
  }
  expect.fail(`expected a refusal with ${refusal.name}, but nothing was refused`);
}
