import type { AdminApi } from './admin-api.ts';

/** What one step did: how many things it added, and how many of the site's it found already there. */
export interface StepResult {
  readonly added: number;
  readonly skipped: number;
}

/**
 * One kind of content the seed loads: the Events, the VenueSettings, the Categories or the Cocktails. Each step
 * holds the site's current content of its kind, knows the admin routes that read and add it, and decides what
 * counts as already there, since only it knows what makes two of its kind the same: for an Event, the same date and
 * title; for a kind with a slug, the same slug.
 */
export interface SeedStep {
  /** What it loads, in the words the seed reports: "events". */
  readonly name: string;
  /** Whether the backend already holds content of this kind. Any at all is enough for the seed to refuse. */
  hasContent(api: AdminApi): Promise<boolean>;
  /**
   * Adds the site's content of this kind that the backend doesn't have yet. What is already there is skipped and
   * left as it is: a step never changes or deletes anything.
   */
  load(api: AdminApi): Promise<StepResult>;
}
