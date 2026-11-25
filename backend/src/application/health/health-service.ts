import { BAR_TIME_ZONE } from '../../domain/shared/bar-time-zone.ts';
import type { Clock } from '../ports/clock.ts';
import type { DatabaseProbe } from '../ports/database-probe.ts';

export interface HealthReport {
  readonly status: 'ok';
  /** The backend's "now", so a host or test harness can see which clock it runs on. */
  readonly time: Date;
  /** The zone the bar's local dates and times are read in. */
  readonly timeZone: string;
}

/**
 * Answers "can the backend serve requests?". It can when its database answers. When it doesn't, the probe's
 * error propagates like any unexpected error and the caller gets a 500, which every host's health check reads
 * as "unhealthy".
 */
export class HealthService {
  private readonly databaseProbe: DatabaseProbe;
  private readonly clock: Clock;

  constructor(databaseProbe: DatabaseProbe, clock: Clock) {
    this.databaseProbe = databaseProbe;
    this.clock = clock;
  }

  async check(): Promise<HealthReport> {
    await this.databaseProbe.ping();
    return { status: 'ok', time: this.clock.now(), timeZone: BAR_TIME_ZONE };
  }
}
