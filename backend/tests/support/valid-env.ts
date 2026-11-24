/**
 * A complete, valid environment: every required variable and nothing optional. Tests start from it and change the
 * one thing they are about. Every value is a test-only placeholder: none of them is used anywhere real.
 */
export const VALID_ENV: Readonly<Record<string, string>> = {
  PORT: '3000',
  MONGODB_URI: 'mongodb://localhost:27017/oscar-test',
  JWT_SECRET: 'test-only-secret-that-is-at-least-32-characters',
  // Shaped like a bcrypt hash; it is not the hash of any password.
  ADMIN_PASSWORD_HASH: `$2b$10$${'x'.repeat(53)}`,
  CORS_ORIGINS: 'https://oscarclubsofia.com',
};

/** VALID_ENV without one variable, as if it had never been set. */
export function envWithout(name: string): Record<string, string> {
  const env = { ...VALID_ENV };
  delete env[name];
  return env;
}
