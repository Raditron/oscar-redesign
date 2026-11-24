/** The backend refused a request, couldn't be reached, or answered something the seed can't use. */
export class AdminApiError extends Error {
  override readonly name = 'AdminApiError';
  /** The error code the backend answered with (VENUE_SETTINGS_NOT_FOUND, …); undefined when it gave none. */
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

/**
 * The admin API as the seed uses it: a logged-in client over plain HTTP (the fetch built into Node), the way the
 * admin panel talks to the backend. It knows paths and JSON, never the backend's code, so the seed loads content
 * through exactly the rules an Admin's edits go through.
 */
export class AdminApi {
  private readonly backendUrl: string;
  /** Sent with every request: the session's token, once logged in. */
  private readonly headers: Readonly<Record<string, string>>;

  private constructor(backendUrl: string, headers: Readonly<Record<string, string>>) {
    this.backendUrl = backendUrl;
    this.headers = headers;
  }

  /** Logs in with the admin password. The password is sent once, to POST /auth/login, and kept nowhere. */
  static async logIn(backendUrl: string, password: string): Promise<AdminApi> {
    // Without a trailing slash, so `${backendUrl}${path}` never doubles one.
    const base = backendUrl.replace(/\/+$/, '');
    // Logging in is the one request made without a token, since it is where the token comes from.
    const notLoggedIn = new AdminApi(base, {});
    const { token } = (await notLoggedIn.post('/auth/login', { password })) as { token: string };
    return new AdminApi(base, { Authorization: `Bearer ${token}` });
  }

  get(path: string): Promise<unknown> {
    return this.request('GET', path);
  }

  post(path: string, body: unknown): Promise<unknown> {
    return this.request('POST', path, body);
  }

  put(path: string, body: unknown): Promise<unknown> {
    return this.request('PUT', path, body);
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(`${this.backendUrl}${path}`, {
        method,
        headers: body === undefined ? this.headers : { ...this.headers, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      throw new AdminApiError(`Could not reach the backend at ${this.backendUrl}: ${causeOf(error)}`);
    }
    const answer: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      // The shared error format: a code for programs, a message for people.
      const { code, message } = (answer ?? {}) as { code?: string; message?: string };
      const status = code === undefined ? `${response.status}` : `${response.status} ${code}`;
      throw new AdminApiError(`${method} ${path} answered ${status}: ${message ?? response.statusText}`, code);
    }
    return answer;
  }
}

/** fetch fails with "fetch failed" and keeps the reason (a refused connection, an unknown host) in its cause. */
function causeOf(error: unknown): string {
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error;
  return cause instanceof Error ? cause.message : String(cause);
}
