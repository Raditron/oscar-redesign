import type { Db } from 'mongodb';
import type { DatabaseProbe } from '../../application/ports/database-probe.ts';

/** Adapter: the DatabaseProbe port, answered by MongoDB's own `ping` command. */
export class MongoDatabaseProbe implements DatabaseProbe {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async ping(): Promise<void> {
    await this.db.command({ ping: 1 });
  }
}
