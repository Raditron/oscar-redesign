import { fileURLToPath } from 'node:url';

/** The backend's own folder: its processes and scripts run from here. */
export const BACKEND_DIR = fileURLToPath(new URL('../..', import.meta.url));

/** Node's arguments to run a TypeScript file from src/ as it is, under Node's own type stripping: no build first. */
export function nodeArgs(sourceFile: string): string[] {
  return ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', sourceFile];
}
