// Seam: the seed script, run from a terminal as `npm run seed -- --backend <url>` starts it. The admin password goes
// in on standard input, never as an argument, which the shell would keep in its history; what it did comes out on
// standard output, and a refusal on standard error with exit code 1. What the seed itself loads, skips and refuses
// is checked once, at its own seam (tests/seed/); these tests check only what the command line adds to it.
import { spawn } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { seed } from '../../src/seed/seed.ts';
import { addEvent, eventOn } from '../support/events.ts';
import { freePort } from '../support/free-port.ts';
import { BACKEND_DIR, nodeArgs } from '../support/source-process.ts';
import { startTestBackend } from '../support/test-backend.ts';
import { ADMIN_PASSWORD } from '../support/valid-env.ts';

interface Run {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * Runs the seed script with `args`, typing `input` into it. Asynchronous on purpose: the backend it talks to runs
 * in this test's own process, and a synchronous spawn would stop it from answering.
 */
function runSeed(args: readonly string[], input = `${ADMIN_PASSWORD}\n`): Promise<Run> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [...nodeArgs('src/scripts/seed.ts'), ...args], { cwd: BACKEND_DIR });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (status) => resolve({ status, stdout, stderr }));
    child.stdin.end(input);
  });
}

describe('npm run seed', () => {
  it('loads into an empty database, says what it added, and never prints the password', async () => {
    const { url } = await startTestBackend();

    const run = await runSeed(['--backend', url]);

    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/added 2 events/i);
    expect(run.stdout + run.stderr).not.toContain(ADMIN_PASSWORD);
  }, 20_000);

  it('refuses a database that has content with exit code 1, saying why and how to load anyway', async () => {
    const { url, api } = await startTestBackend();
    await addEvent(api, eventOn('2026-11-28'));

    const run = await runSeed(['--backend', url]);

    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/already has events/);
    expect(run.stderr).toContain('--force');
  }, 20_000);

  it('with --force, adds only what is missing and says how many it skipped as already there', async () => {
    const { url } = await startTestBackend();
    await seed({ backendUrl: url, password: ADMIN_PASSWORD });

    const run = await runSeed(['--backend', url, '--force']);

    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/added 0 events, skipped 2 already there/i);
  }, 20_000);

  it('stops with exit code 1 when the backend cannot be reached, naming its address', async () => {
    const nobodyThere = `http://127.0.0.1:${await freePort()}`;

    const run = await runSeed(['--backend', nobodyThere]);

    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`Could not reach the backend at ${nobodyThere}`);
  }, 20_000);

  it.each([
    ['without --backend', []],
    ['with an argument it does not know', ['--backend', 'http://127.0.0.1:3000', '--wipe']],
  ])('stops %s with exit code 1 and how to run it, before asking for the password', async (_case, args) => {
    const run = await runSeed(args, '');

    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/npm run seed -- --backend/);
    expect(run.stderr).not.toMatch(/password/i);
  }, 20_000);
});
