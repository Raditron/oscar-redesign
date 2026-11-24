/**
 * Port: "can the database answer?". The health check needs it; the infrastructure layer implements it, so the
 * application never imports the MongoDB driver.
 */
export interface DatabaseProbe {
  /** Resolves when the database answers; rejects when it can't be reached. */
  ping(): Promise<void>;
}
