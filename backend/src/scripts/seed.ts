// `npm run seed -- --backend <base URL> [--force]`: fills the backend's empty database with the site's current
// content, through its admin API (see src/seed/seed.ts). The backend must be running. The admin password is read
// from standard input (see read-password.ts), sent once to log in, and neither kept nor printed.
//
// Like main.ts, this sits outside the four layers: a tool run by hand.
import { parseArgs } from 'node:util';
import { AdminApiError } from '../seed/admin-api.ts';
import { seed, SeedRefusedError, type SeedResult } from '../seed/seed.ts';
import { readPassword } from './read-password.ts';

const USAGE = `Usage: npm run seed -- --backend <base URL> [--force]
  --backend  the running backend, e.g. http://localhost:3000
  --force    load into a database that has content: adds only what is missing, changes and deletes nothing`;

async function main(): Promise<number> {
  const options = readOptions();
  // Checked before the password is asked for, so a mistyped command costs no typing.
  if (options === undefined) {
    console.error(USAGE);
    return 1;
  }
  const password = await readPassword();
  if (password === undefined) return 1;
  try {
    const results = await seed({ backendUrl: options.backend, password, force: options.force });
    for (const result of results) console.log(report(result));
    return 0;
  } catch (error) {
    if (error instanceof SeedRefusedError) {
      console.error(error.message);
      console.error('Run it again with --force to add only what is missing: nothing already there is changed or deleted.');
      return 1;
    }
    if (error instanceof AdminApiError) {
      console.error(error.message);
      return 1;
    }
    throw error;
  }
}

/** The command line's options, or undefined when they are missing or not understood. */
function readOptions(): { backend: string; force: boolean } | undefined {
  try {
    const { values } = parseArgs({ options: { backend: { type: 'string' }, force: { type: 'boolean', default: false } } });
    return values.backend === undefined ? undefined : { backend: values.backend, force: values.force };
  } catch {
    return undefined;
  }
}

function report({ step, added, skipped }: SeedResult): string {
  return skipped === 0 ? `Added ${added} ${step}.` : `Added ${added} ${step}, skipped ${skipped} already there.`;
}

process.exitCode = await main();
