import type { Response } from 'supertest';
import { expect } from 'vitest';

/**
 * Expects `response` to have `status`, and when it hasn't, says what the backend answered instead:
 * "expected 201, got 400 VALIDATION_FAILED: Some fields are missing or invalid. (price: Enter the price …)".
 * A bare `expect(response.status).toBe(201)` says only "expected 400 to be 201" and leaves you to find out why.
 *
 * The owner's tests check every status through it, so until a route is written they fail saying
 * "got 501 NOT_IMPLEMENTED", the one reason they're meant to fail for.
 */
export function expectStatus(response: Response, status: number): void {
  expect(response.status, `expected ${status}, got ${answerOf(response)}`).toBe(status);
}

/** A response as one line: its status, and the code, message and field details of an error body. */
function answerOf(response: Response): string {
  const { code, message, details } = (response.body ?? {}) as {
    code?: string;
    message?: string;
    details?: readonly { field: string; message: string }[];
  };
  if (code === undefined) return String(response.status);
  const fields = details?.map((detail) => `${detail.field}: ${detail.message}`).join('; ');
  return `${response.status} ${code}: ${message ?? ''}${fields ? ` (${fields})` : ''}`;
}
