/** The made-up admin password that VALID_ENV's ADMIN_PASSWORD_HASH was made from. Test-only: it guards nothing real. */
export const ADMIN_PASSWORD = 'test-only admin password';

/**
 * A complete, valid environment: every required variable and nothing optional. Tests start from it and change the
 * one thing they are about. Every value is a test-only placeholder: none of them is used anywhere real.
 */
export const VALID_ENV: Readonly<Record<string, string>> = {
  PORT: '3000',
  MONGODB_URI: 'mongodb://localhost:27017/oscar-test',
  JWT_SECRET: 'test-only-secret-that-is-at-least-32-characters',
  // The bcrypt hash of ADMIN_PASSWORD, at bcrypt's lowest cost (04) so that every test login is quick.
  ADMIN_PASSWORD_HASH: '$2b$04$eawuC/RdafIgCpBapLM17ejXMtAdPkcw.8TWAKQidYn3uUinpQGDC',
  CORS_ORIGINS: 'https://oscarclubsofia.com',
};

/** VALID_ENV without one variable, as if it had never been set. */
export function envWithout(name: string): Record<string, string> {
  const env = { ...VALID_ENV };
  delete env[name];
  return env;
}
