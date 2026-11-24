import { Router } from 'express';
import { z } from 'zod';
import type { AdminAuthService } from '../../../application/auth/admin-auth-service.ts';
import { parseBody } from '../validation.ts';

const PASSWORD_REQUIRED = 'Enter the admin password.';

// Only the shape is checked here. Whether the password is right is the application's question, and a body that
// fails this check never reaches it, so it doesn't count as a failed login.
const LoginBody = z.object({
  password: z.string({ error: PASSWORD_REQUIRED }).min(1, { error: PASSWORD_REQUIRED }),
});

/** POST /auth/login: no token needed, since this is where an Admin gets one. */
export function loginRouter(auth: AdminAuthService): Router {
  const router = Router();

  router.post('/auth/login', async (request, response) => {
    const { password } = parseBody(LoginBody, request.body);
    // The client's IP address, as Express works it out: see TRUST_PROXY_HOPS for when a proxy stands in between.
    // Express has none only once the connection has closed, and then no answer reaches anyone.
    const session = await auth.logIn(password, request.ip ?? '');
    // Until it expires, the token is as good as the password: no cache, the browser's or one on the way, may keep it.
    response.set('Cache-Control', 'no-store');
    response.json({ token: session.token, expiresAt: session.expiresAt.toISOString() });
  });

  return router;
}
