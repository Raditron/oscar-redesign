/**
 * Port: "is this the one shared admin password?". The adapter holds only the password's hash, from the env config,
 * so the application never sees a hash or a hashing library, and the password itself is stored nowhere.
 */
export interface AdminPassword {
  matches(candidate: string): Promise<boolean>;
  /**
   * A short label for the current password: it changes whenever the password does, and gives nothing away about it
   * or its hash. A session records the label it was started under, so a new password ends the sessions before it.
   */
  readonly fingerprint: string;
}
