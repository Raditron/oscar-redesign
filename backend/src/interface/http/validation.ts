import type { z } from 'zod';
import { HttpError } from './errors/http-error.ts';

/**
 * Checks a request body against its zod schema and returns it, typed. When it doesn't fit, throws a 400 that lists
 * every problem, field by field, so a client can show each message next to its field in one go.
 */
export function parseBody<Schema extends z.ZodType>(schema: Schema, body: unknown): z.infer<Schema> {
  // Express leaves the body undefined when a request has none (or no JSON Content-Type). Checking it as an empty
  // object tells the client which fields are missing, instead of only that the body is.
  const result = schema.safeParse(body ?? {});
  if (result.success) return result.data;
  throw new HttpError(400, {
    code: 'VALIDATION_FAILED',
    message: 'Some fields are missing or invalid.',
    details: result.error.issues.map((issue) => ({ field: issue.path.map(String).join('.'), message: issue.message })),
  });
}
