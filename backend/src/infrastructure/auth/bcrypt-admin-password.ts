import { createHmac } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { AdminPassword } from '../../application/ports/admin-password.ts';

/**
 * Adapter: the AdminPassword port, checked against the bcrypt hash in the env config. bcrypt is slow on purpose,
 * which makes guessing expensive. bcryptjs is the pure-JavaScript implementation: nothing to compile on install.
 */
export class BcryptAdminPassword implements AdminPassword {
  private readonly hash: string;
  readonly fingerprint: string;

  constructor(hash: string) {
    this.hash = hash;
    this.fingerprint = fingerprintOf(hash);
  }

  matches(candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.hash);
  }
}

/**
 * 16 characters of an HMAC keyed with the hash itself. Every session token carries it, and anyone holding a token
 * can read it, so it must not be the hash or a plain digest of it: without the hash as its key, an HMAC can't be
 * worked back or checked against a guess. 16 base64url characters (96 bits) are plenty to tell two hashes apart.
 */
function fingerprintOf(hash: string): string {
  return createHmac('sha256', hash).update('admin session').digest('base64url').slice(0, 16);
}
