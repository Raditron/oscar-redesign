// The seed: fills an empty database with the site's current content, so nothing is lost in the move to the backend
// and every environment (a developer's, the browser suite's, production on its first day) starts from the real
// content. `npm run seed` runs it from the command line (src/scripts/seed.ts); a program calls `seed()`.
//
// It goes through the admin API, like the admin panel, rather than writing to MongoDB: so seeded content passes the
// same checks as an Admin's edits, and the seed needs only the backend's address and the admin password, never a
// database connection. Like scripts/, it sits outside the four layers, and imports none of them: to the backend,
// it's one more client.
import { AdminApi } from './admin-api.ts';
import type { SeedStep, StepResult } from './seed-step.ts';
import { eventsStep } from './steps/events.ts';

/**
 * The steps, in the order they load. A step that is written but not switched on yet (because the backend's routes
 * for it don't exist) stays out of this list until they do: venueSettingsStep, categoriesStep and cocktailsStep, in
 * steps/, are added here, in that order, by the owner's slices #36, #37 and #38.
 */
const SEED_STEPS: readonly SeedStep[] = [eventsStep];

export interface SeedOptions {
  /** The backend's base URL, e.g. http://localhost:3000. */
  readonly backendUrl: string;
  /** The admin password in plain text. It is used to log in and kept nowhere. */
  readonly password: string;
  /**
   * Load into a database that already has content: only what is missing is added. What is already there (an Event
   * with the same date and title) is skipped and left as it is, and nothing is ever deleted, so a forced seed run
   * against the wrong database can't destroy what an Admin has entered.
   */
  readonly force?: boolean;
}

/** What one step did: its name, how many things it added, and how many it skipped as already there. */
export interface SeedResult extends StepResult {
  readonly step: string;
}

/** The database already has content, so the seed changed nothing. */
export class SeedRefusedError extends Error {
  override readonly name = 'SeedRefusedError';

  constructor(stepsWithContent: readonly string[]) {
    super(`The backend already has ${stepsWithContent.join(', ')}. The seed only fills an empty database, so it changed nothing.`);
  }
}

/**
 * Loads the site's content through the admin API at `backendUrl`, step by step. Refuses with SeedRefusedError,
 * before loading anything, when any step's content is already there, unless `force` is set; then each step adds
 * only what is missing. A refused login, an unreachable backend or a refused request ends it with an AdminApiError.
 */
export async function seed({ backendUrl, password, force = false }: SeedOptions): Promise<SeedResult[]> {
  const api = await AdminApi.logIn(backendUrl, password);
  if (!force) {
    const withContent: string[] = [];
    for (const step of SEED_STEPS) if (await step.hasContent(api)) withContent.push(step.name);
    if (withContent.length > 0) throw new SeedRefusedError(withContent);
  }
  const results: SeedResult[] = [];
  for (const step of SEED_STEPS) results.push({ step: step.name, ...(await step.load(api)) });
  return results;
}
