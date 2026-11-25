import { Router } from 'express';
import type { EventService } from '../../../application/events/event-service.ts';
import { parseBody } from '../validation.ts';
import { EventBody } from './event-body.ts';
import { adminEventJson, publicEventJson } from './event-json.ts';

/**
 * Every route for Events, for guests and for the admin panel. Each handler (a controller) does only HTTP: read the
 * request, call one use case, write the answer. It has no rules of its own and catches no errors: whatever a use
 * case throws (an unknown id, say) goes to the error handler, which answers it in the shared format.
 *
 * Who may call which route is decided by its path alone, in http-app.ts: /admin/… needs a token, /public/… doesn't.
 */
export function eventsRouter(events: EventService): Router {
  const router = Router();

  router.get('/public/events', async (_request, response) => {
    const upcoming = await events.upcomingForGuests();
    response.json(upcoming.map(publicEventJson));
  });

  router.get('/admin/events', async (_request, response) => {
    const listed = await events.listForAdmin();
    response.json(listed.map(adminEventJson));
  });

  router.post('/admin/events', async (request, response) => {
    const details = parseBody(EventBody, request.body);
    const added = await events.add(details);
    response.status(201).json(adminEventJson(added));
  });

  router.put('/admin/events/:id', async (request, response) => {
    const details = parseBody(EventBody, request.body);
    const edited = await events.edit(request.params.id, details);
    response.json(adminEventJson(edited));
  });

  router.delete('/admin/events/:id', async (request, response) => {
    await events.delete(request.params.id);
    response.status(204).end();
  });

  return router;
}
