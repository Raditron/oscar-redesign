// Seam: the environment, as the backend reads it at startup. An environment is either refused, with a message that
// names every variable to fix, or accepted. The message is the one main.ts prints, so refusals are checked here
// through loadConfig, without starting a process for every case. What an accepted value then does is checked on the
// running backend (the CORS tests, the startup test), never by reading the Config that loadConfig returns.
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../../src/config.ts';
import { VALID_ENV, envWithout } from '../support/valid-env.ts';

const REQUIRED = Object.keys(VALID_ENV);

/** The message loadConfig refuses `env` with. Fails the test if it accepts it. */
function refusal(env: Readonly<Record<string, string | undefined>>): string {
  try {
    loadConfig(env);
  } catch (error) {
    if (error instanceof ConfigError) return error.message;
    throw error;
  }
  throw new Error('expected the environment to be refused, but it was accepted');
}

/** The variables a refusal names: one problem per line after the first, each line starting with its variable. */
const refusedVariables = (message: string) => message.split('\n').slice(1).map((line) => line.trim().split(' ')[0]);

describe('loadConfig', () => {
  it.each(REQUIRED)('refuses an environment without %s, naming it', (name) => {
    expect(refusal(envWithout(name))).toContain(`${name} is required`);
  });

  it.each(REQUIRED)('treats an empty %s as missing', (name) => {
    expect(refusal({ ...VALID_ENV, [name]: '' })).toContain(`${name} is required`);
  });

  it.each([
    ['PORT', 'abc'],
    ['PORT', '0'],
    ['PORT', '65536'],
    ['PORT', '3000.5'],
    ['MONGODB_URI', 'http://localhost:27017/oscar'],
    ['MONGODB_URI', 'mongodb://localhost:27017'], // no database name: the driver would quietly use "test"
    ['MONGODB_URI', 'mongodb://localhost:27017/'],
    ['JWT_SECRET', 'x'.repeat(31)],
    ['ADMIN_PASSWORD_HASH', 'correct horse battery staple'],
    ['CORS_ORIGINS', 'oscarclubsofia.com'],
    ['CORS_ORIGINS', 'https://oscarclubsofia.com/'],
    ['CORS_ORIGINS', 'https://oscarclubsofia.com/menu'],
    ['CORS_ORIGINS', 'https://OscarClubSofia.com'], // browsers send the host in lower case, so this never matches
    ['CORS_ORIGINS', '*'],
    ['CORS_ORIGINS', ' , '],
    ['CORS_ALLOW_LOCALHOST', 'yes'],
  ])('refuses a malformed %s (%s), naming it', (name, value) => {
    expect(refusedVariables(refusal({ ...VALID_ENV, [name]: value }))).toEqual([name]);
  });

  it.each([
    ['http://localhost:4173', undefined],
    ['https://oscarclubsofia.com,http://127.0.0.1:5173', undefined],
    ['http://localhost:4173', 'true'],
  ])(
    'refuses the local address in CORS_ORIGINS=%s (CORS_ALLOW_LOCALHOST=%s) and names the switch that allows it',
    (origins, allowLocalhost) => {
      // Only the development switch, off unless set, may allow localhost: never a line in the production origin list.
      const message = refusal({ ...VALID_ENV, CORS_ORIGINS: origins, CORS_ALLOW_LOCALHOST: allowLocalhost });

      expect(refusedVariables(message)).toEqual(['CORS_ORIGINS']);
      expect(message).toContain('CORS_ALLOW_LOCALHOST=true');
    },
  );

  it.each([
    ['MONGODB_URI', 'mongodb://localhost:27017/oscar'],
    ['MONGODB_URI', 'mongodb://user:pass@db1.example.com:27017,db2.example.com:27017/oscar?replicaSet=rs0'],
    ['MONGODB_URI', 'mongodb+srv://user:pass@cluster0.example.mongodb.net/oscar?retryWrites=true&w=majority'],
    ['JWT_SECRET', 'x'.repeat(32)], // the shortest secret allowed
  ])('accepts %s=%s', (name, value) => {
    expect(() => loadConfig({ ...VALID_ENV, [name]: value })).not.toThrow();
  });

  it('lists every problem at once, so one deploy shows everything to fix', () => {
    const refused = refusedVariables(refusal({ PORT: 'abc', CORS_ORIGINS: '*' }));

    expect(new Set(refused)).toEqual(new Set(REQUIRED));
  });

  it('never repeats a secret value in its message', () => {
    const message = refusal({
      ...VALID_ENV,
      MONGODB_URI: 'http://admin:mongo-password-1@db.example.com/oscar',
      JWT_SECRET: 'short-jwt-secret',
      ADMIN_PASSWORD_HASH: 'plain-admin-password',
    });

    expect(refusedVariables(message)).toEqual(['MONGODB_URI', 'JWT_SECRET', 'ADMIN_PASSWORD_HASH']);
    for (const secret of ['mongo-password-1', 'short-jwt-secret', 'plain-admin-password']) expect(message).not.toContain(secret);
  });
});

describe('.env.example', () => {
  it('lists every environment variable, and its placeholder secrets are refused, so a copy of it can never run as it is', () => {
    const example = parseEnv(readFileSync(new URL('../../.env.example', import.meta.url), 'utf8'));

    expect(refusedVariables(refusal(example))).toEqual(['JWT_SECRET', 'ADMIN_PASSWORD_HASH']);
  });
});
