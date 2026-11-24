// The backend's env config, read from environment variables once at startup and checked before anything else runs.
// A missing or malformed value stops the process with a message naming the variable, so a misconfiguration fails
// at deploy time instead of quietly at runtime. Every variable is described in .env.example.
//
// This file sits outside the four layers (see ARCHITECTURE.md): only main.ts calls loadConfig, and the composition
// root hands each part of the Config to the object that needs it.
import { z } from 'zod';
import { isLocalhost, type CorsOptions } from './interface/http/cors.ts';

export interface Config {
  readonly port: number;
  /** The MongoDB connection string, including the database name. */
  readonly mongoUri: string;
  readonly auth: {
    /** Signs and verifies admin session tokens. */
    readonly jwtSecret: string;
    /** The bcrypt hash of the one shared admin password (never the password itself). */
    readonly adminPasswordHash: string;
  };
  /** The browser origins allowed to call the API (the site's own addresses), and the development switch. */
  readonly cors: CorsOptions;
}

/** The environment cannot run the backend. The message lists every problem, one per line, each naming its variable. */
export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

// Messages never repeat the value they reject: several of these variables hold secrets, and the message ends up in
// deploy logs. CORS origins are the one exception, because they are public and the bad one is hard to spot otherwise.

// An unset variable and an empty one (`JWT_SECRET=` in a .env file) are the same mistake.
const required = () => z.string({ error: 'is required' }).min(1, { error: 'is required', abort: true });

const PORT_RULE = 'must be a whole number from 1 to 65535';
const port = required()
  .regex(/^\d+$/, { error: PORT_RULE })
  .transform(Number)
  .refine((value) => value >= 1 && value <= 65535, { error: PORT_RULE });

// The database name must be in the URI: without one the driver silently uses a database called "test".
const mongoUri = required().regex(/^mongodb(\+srv)?:\/\/[^/?#]+\/[^/?#]+/, {
  error: 'must be a mongodb:// or mongodb+srv:// URI that names the database, e.g. mongodb://localhost:27017/oscar',
});

// 32 characters is the floor for an HMAC-SHA256 signing key that can't be guessed.
const jwtSecret = required().min(32, { error: 'must be at least 32 characters long' });

// $2a$/$2b$/$2y$, a two-digit cost, then 53 characters of salt and hash.
const bcryptHash = required().regex(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/, {
  error: 'must be a bcrypt hash (it starts with $2b$), never the password itself',
});

/** An origin as a browser sends it in the Origin header: scheme, host and optional port, nothing else. */
function isOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.origin === value;
  } catch {
    return false;
  }
}

const origin = z
  .string()
  .refine(isOrigin, {
    error: (issue) => `has "${String(issue.input)}", which is not an origin: write scheme://host[:port], with no path or trailing slash`,
    abort: true,
  })
  // Listed here, localhost would be allowed in production too: only the switch, off unless set, may allow it.
  .refine((value) => !isLocalhost(value), {
    error: (issue) => `has "${String(issue.input)}", a local address: set CORS_ALLOW_LOCALHOST=true instead, for development only`,
  });

const corsOrigins = required()
  .transform((list) => list.split(',').map((entry) => entry.trim()).filter((entry) => entry !== ''))
  .pipe(z.array(origin).min(1, { error: 'must list at least one origin' }));

// Optional and off by default, so production never allows localhost by accident.
const allowLocalhost = z
  .enum(['true', 'false', ''], { error: 'must be true or false' })
  .optional()
  .transform((value) => value === 'true');

const EnvSchema = z.object({
  PORT: port,
  MONGODB_URI: mongoUri,
  JWT_SECRET: jwtSecret,
  ADMIN_PASSWORD_HASH: bcryptHash,
  CORS_ORIGINS: corsOrigins,
  CORS_ALLOW_LOCALHOST: allowLocalhost,
});

/** Reads and checks the env config. Throws a ConfigError listing every problem when the environment is not usable. */
export function loadConfig(env: Readonly<Record<string, string | undefined>>): Config {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `  ${String(issue.path[0])} ${issue.message}`);
    throw new ConfigError(`The backend cannot start. Fix these environment variables:\n${problems.join('\n')}`);
  }
  const vars = result.data;
  return {
    port: vars.PORT,
    mongoUri: vars.MONGODB_URI,
    auth: { jwtSecret: vars.JWT_SECRET, adminPasswordHash: vars.ADMIN_PASSWORD_HASH },
    cors: { origins: vars.CORS_ORIGINS, allowLocalhost: vars.CORS_ALLOW_LOCALHOST },
  };
}
