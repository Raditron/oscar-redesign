import type { Response } from 'supertest';
import { expect } from 'vitest';
import { expectStatus } from './expect-status.ts';

interface FieldError {
  readonly field: string;
  readonly message: string;
}

/**
 * Expects a 400 VALIDATION_FAILED whose `details` name each of `fields`, every detail with a message for the Admin.
 *
 * A field counts as named by a detail on it or on a field inside it: for a missing `happyHour`, a detail on
 * `happyHour` or on `happyHour.from` both tell the admin panel where to look. Other details may come too, and in
 * any order. What is pinned is what the admin panel needs, to show each message next to its field; how the checks
 * are split up is the backend's own business.
 */
export function expectValidationFailed(response: Response, fields: readonly string[]): void {
  expectStatus(response, 400);
  expect(response.body).toMatchObject({ code: 'VALIDATION_FAILED', message: expect.any(String) });
  const details: readonly FieldError[] = response.body.details;
  expect(details, 'a 400 VALIDATION_FAILED for a request body lists its problems in `details`').toEqual(expect.any(Array));
  for (const detail of details) expect(detail).toEqual({ field: expect.any(String), message: expect.stringMatching(/\S/) });
  const named = details.map((detail) => detail.field);
  for (const field of fields) {
    expect(
      named.some((name) => name === field || name.startsWith(`${field}.`)),
      `expected a detail on ${field} or a field inside it, got ${named.join(', ') || 'none'}`,
    ).toBe(true);
  }
}
