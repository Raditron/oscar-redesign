/**
 * Every error code the API answers with. Clients (the site, the admin panel) branch on these, never on the
 * message text. Each slice adds the codes it needs here, so this union is the whole catalogue in one place.
 */
export type ErrorCode = 'ROUTE_NOT_FOUND' | 'INTERNAL_ERROR';

/** One problem with one field of a request, e.g. { field: 'title.en', message: 'Enter the English title' }. */
export interface FieldError {
  /** The path to the field in the request body, joined with dots. */
  readonly field: string;
  readonly message: string;
}

/** The body of every error response, whatever the route and whatever went wrong. */
export interface ErrorBody {
  readonly code: ErrorCode;
  /** For people: safe to show, never contains internals. */
  readonly message: string;
  /** Validation failures only: every problem with the request, field by field. */
  readonly details?: readonly FieldError[];
}

/**
 * An error that already knows its HTTP answer. The interface layer throws these (or translates domain and
 * application errors into them); the central error handler sends `status` and `body` as they are.
 */
export class HttpError extends Error {
  override readonly name = 'HttpError';
  readonly status: number;
  readonly body: ErrorBody;

  constructor(status: number, body: ErrorBody) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}
