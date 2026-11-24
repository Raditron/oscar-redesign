// Seam: the hash-password script, run as the owner runs it (`npm run hash-password`). The password goes in on
// standard input, never as an argument, which the shell would keep in its history; the bcrypt hash for
// ADMIN_PASSWORD_HASH comes out on standard output.
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { BACKEND_DIR, nodeArgs } from '../support/source-process.ts';
import { createTestBackend } from '../support/test-backend.ts';
import { ADMIN_PASSWORD } from '../support/valid-env.ts';

// Made up for this test, like every password in the tests.
const NEW_PASSWORD = 'a made-up password, for this test only';

function hashPassword(input: string) {
  return spawnSync(process.execPath, nodeArgs('src/scripts/hash-password.ts'), {
    cwd: BACKEND_DIR,
    input,
    encoding: 'utf8',
    timeout: 20_000,
  });
}

describe('npm run hash-password', () => {
  it('prints a hash that, set as ADMIN_PASSWORD_HASH, lets that password log in and no other', async () => {
    const result = hashPassword(`${NEW_PASSWORD}\n`);
    const api = await createTestBackend({ env: { ADMIN_PASSWORD_HASH: result.stdout.trim() } });

    const withNewPassword = await api.post('/auth/login').send({ password: NEW_PASSWORD });
    const withOldPassword = await api.post('/auth/login').send({ password: ADMIN_PASSWORD });

    expect(result.status).toBe(0);
    expect(withNewPassword.status).toBe(200);
    expect(withOldPassword.status).toBe(401);
  });

  it('prints nothing but the hash on standard output, and never the password', () => {
    const result = hashPassword(`${NEW_PASSWORD}\n`);

    expect(result.stdout).toMatch(/^\$2b\$\d{2}\$[./A-Za-z0-9]{53}\n$/);
    expect(result.stdout + result.stderr).not.toContain(NEW_PASSWORD);
  });

  it('keeps spaces in the password, and drops only the line ending, \\n or \\r\\n', async () => {
    const result = hashPassword('  spaced out  \r\n');
    const api = await createTestBackend({ env: { ADMIN_PASSWORD_HASH: result.stdout.trim() } });

    const response = await api.post('/auth/login').send({ password: '  spaced out  ' });

    expect(response.status).toBe(200);
  });

  it.each([
    ['an empty line', '\n'],
    ['no input at all', ''],
  ])('refuses %s with exit code 1, a message, and no hash', (_case, input) => {
    const result = hashPassword(input);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/no password/i);
    expect(result.stdout).toBe('');
  });
});
