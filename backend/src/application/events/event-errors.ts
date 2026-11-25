// What the event use cases refuse, and why. Like every application error, it knows nothing of HTTP: the interface
// layer (toHttpError) gives it its status and code.

/** An Admin asked for an Event that doesn't exist: never added, or deleted since. */
export class EventNotFoundError extends Error {
  override readonly name = 'EventNotFoundError';

  constructor() {
    super('There is no such event. It may have been deleted.');
  }
}
