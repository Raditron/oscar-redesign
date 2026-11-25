// Seam: starting the backend as a process, the way `npm start` does, with nothing but environment variables.
// The source runs under Node's own type stripping, so no build is needed first.
import { spawn, spawnSync } from 'node:child_process';
import { describe, expect, inject, it, onTestFinished } from 'vitest';
import { freePort } from '../support/free-port.ts';
import { BACKEND_DIR, nodeArgs } from '../support/source-process.ts';
import { ADMIN_PASSWORD, VALID_ENV, envWithout } from '../support/valid-env.ts';

const NODE_ARGS = nodeArgs('src/main.ts');
const BACKEND_VARIABLES = [...Object.keys(VALID_ENV), 'CORS_ALLOW_LOCALHOST', 'TRUST_PROXY_HOPS'];

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

  it('never writes the admin password to its output, whatever a login sends', async () => {
    const port = await freePort();
    const child = spawn(process.execPath, NODE_ARGS, {
      cwd: BACKEND_DIR,
      env: processEnv({ ...VALID_ENV, PORT: String(port), MONGODB_URI: `${inject('mongoUri')}oscar-startup-test` }),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    onTestFinished(() => {
      child.kill();
    });
    await pollJson(`http://127.0.0.1:${port}/health`);

    const logIn = async (body: string) => {
      const init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body };
      return (await fetch(`http://127.0.0.1:${port}/auth/login`, init)).status;
    };
    const statuses = [
      await logIn(JSON.stringify({ password: ADMIN_PASSWORD })),
      await logIn(JSON.stringify({ password: `${ADMIN_PASSWORD}?` })),
      await logIn(`{"password": "${ADMIN_PASSWORD}`), // JSON that doesn't parse
      await logIn(JSON.stringify({ password: ADMIN_PASSWORD, padding: 'x'.repeat(200 * 1024) })), // too large
    ];
    const exited = new Promise((resolve) => child.once('exit', resolve));
    child.kill();
    await exited;

    expect(statuses).toEqual([200, 401, 400, 413]);
    expect(output).not.toContain(ADMIN_PASSWORD);
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
