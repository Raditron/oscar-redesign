// Seam: starting the backend as a process, the way `npm start` does, with nothing but environment variables.
// The source runs under Node's own type stripping, so no build is needed first.
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, inject, it, onTestFinished } from 'vitest';
import { freePort } from '../support/free-port.ts';
import { VALID_ENV, envWithout } from '../support/valid-env.ts';

const BACKEND_DIR = fileURLToPath(new URL('../..', import.meta.url));
const NODE_ARGS = ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', 'src/main.ts'];
const BACKEND_VARIABLES = [...Object.keys(VALID_ENV), 'CORS_ALLOW_LOCALHOST'];

/** This process's environment, minus any backend variable a developer may have exported, plus `variables`. */
function processEnv(variables: Readonly<Record<string, string>>): NodeJS.ProcessEnv {
  const inherited = Object.entries(process.env).filter(([name]) => !BACKEND_VARIABLES.includes(name));
  return { ...Object.fromEntries(inherited), ...variables };
}

describe('starting the backend', () => {
  it('stops with exit code 1 and a message naming a missing environment variable', () => {
    const result = spawnSync(process.execPath, NODE_ARGS, {
      cwd: BACKEND_DIR,
      env: processEnv(envWithout('JWT_SECRET')),
      encoding: 'utf8',
      timeout: 20_000,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('JWT_SECRET is required');
    expect(result.stderr, 'a configuration problem is reported without a stack trace').not.toMatch(/^\s+at /m);
  });

  it('serves the API on the configured port, in Sofia time, once its environment is complete', async () => {
    const port = await freePort();
    const child = spawn(process.execPath, NODE_ARGS, {
      cwd: BACKEND_DIR,
      env: processEnv({ ...VALID_ENV, PORT: String(port), MONGODB_URI: `${inject('mongoUri')}oscar-startup-test` }),
      stdio: 'ignore',
    });
    onTestFinished(() => {
      child.kill();
    });

    const body = await pollJson(`http://127.0.0.1:${port}/health`);

    expect(body).toMatchObject({ status: 'ok', timeZone: 'Europe/Sofia' });
  }, 30_000);
});

/** GETs `url` until it answers 200 (the process needs a moment to start), then returns the JSON body. */
async function pollJson(url: string, timeoutMs = 20_000): Promise<unknown> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {
      // not listening yet
    }
    if (Date.now() > deadline) throw new Error(`${url} did not answer 200 within ${timeoutMs} ms`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
