import { Router } from 'express';
import type { HealthService } from '../../../application/health/health-service.ts';

/** GET /health: public, no token. */
export function healthRouter(health: HealthService): Router {
  const router = Router();

  router.get('/health', async (_request, response) => {
    const report = await health.check();
    // The HTTP layer decides how values look on the wire: instants travel as ISO 8601 strings in UTC.
    response.json({ status: report.status, time: report.time.toISOString(), timeZone: report.timeZone });
  });

  return router;
}
