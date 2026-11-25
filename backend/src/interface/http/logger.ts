/**
 * Where the HTTP layer reports problems that no caller is told about in detail, such as the cause of a 500.
 * Declared here because the error handler is the only code that logs; `console` already fits this shape, and tests
 * pass a silent one.
 */
export interface Logger {
  error(message: string, error: unknown): void;
}
