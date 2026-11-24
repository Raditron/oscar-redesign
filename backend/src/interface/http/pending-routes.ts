import { Router } from 'express';
import { HttpError } from './errors/http-error.ts';

interface PendingRoute {
  readonly method: 'get' | 'post' | 'put' | 'delete';
  readonly path: string;
}

/**
 * Scaffolding for the owner's slices: the routes of VenueSettings (#36), Categories (#37) and Cocktails (#38), which
 * their contract tests already call. Until a route is written, its entry here answers it with 501 NOT_IMPLEMENTED in
 * the shared error format, so those tests fail for that one reason, and never for a 404 that could also mean a
 * mistyped path. The paths are the owner's contract (ARCHITECTURE.md, "The owner's contract").
 *
 * When you implement a route, delete its entry. When the list is empty, delete this file and its router in the
 * composition root. A route of yours mounted before this router answers first, so a forgotten entry is harmless.
 */
const PENDING_ROUTES: readonly PendingRoute[] = [
  // #36 VenueSettings
  { method: 'get', path: '/public/venue-settings' },
  { method: 'get', path: '/admin/venue-settings' },
  { method: 'put', path: '/admin/venue-settings' },
  // #37 Categories
  { method: 'get', path: '/public/categories' },
  { method: 'get', path: '/admin/categories' },
  { method: 'post', path: '/admin/categories' },
  { method: 'put', path: '/admin/categories/:id' },
  { method: 'delete', path: '/admin/categories/:id' },
  // #38 Cocktails
  { method: 'get', path: '/public/cocktails' },
  { method: 'get', path: '/admin/cocktails' },
  { method: 'post', path: '/admin/cocktails' },
  { method: 'put', path: '/admin/cocktails/:id' },
  { method: 'delete', path: '/admin/cocktails/:id' },
];

/** The routes still to be written, each answering 501 NOT_IMPLEMENTED. Like every route, /admin ones sit behind the guard. */
export function pendingRoutesRouter(): Router {
  const router = Router();
  for (const { method, path } of PENDING_ROUTES) {
    router[method](path, () => {
      throw new HttpError(501, {
        code: 'NOT_IMPLEMENTED',
        message: `${method.toUpperCase()} ${path} is part of the API, but not implemented yet.`,
      });
    });
  }
  return router;
}
