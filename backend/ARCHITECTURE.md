# Backend architecture

The backend is the single source of truth for everything on the site that changes: the menu, the events, the bar's
hours and its contacts. It is a Node + TypeScript + Express application on MongoDB, deployed on its own host,
separately from the static site. The site fetches from it; the admin panel writes to it.

It is also a practice project in domain-driven design, so its structure is deliberate. This file explains that
structure: the four layers, the one rule between them, and where each kind of code goes. The words it uses for the
bar's things (ServiceNight, Money, Event, …) are defined in [GLOSSARY.md](GLOSSARY.md).

## Running it

Needs Node 22.13 or newer. Everything happens in this folder; the site's own tooling at the repo root never needs the
backend's dependencies, and the site package (`npm run package` at the root) ships nothing from here.

```
npm ci
npm test               # every test, on an in-memory MongoDB (the first run downloads a mongod binary, once)
npm run typecheck      # tsc over src/ and tests/, no output
npm run build          # src/ → dist/
npm start              # runs dist/main.js, reading .env when there is one
npm run hash-password  # asks for the admin password (hidden) and prints its hash for ADMIN_PASSWORD_HASH
```

The backend's own configuration, the env config, comes from environment variables, described one by one in
[.env.example](.env.example). For a local run, copy it to `.env` (git ignores it) and fill it in. The backend checks
every variable at startup and refuses to start, naming each one that is missing or malformed. ("Settings" on its own
is never used for this: it would be mistaken for VenueSettings, the bar's details that the admin panel edits.)

## The layers

```
        interface ─────────┐
       (HTTP: Express)     ▼
                       application ──────▶ domain
                           ▲
     infrastructure ───────┘
   (MongoDB, clocks)

   main.ts · composition-root.ts · config.ts: the outer shell, which knows all four and wires them together
   scripts/: tools the owner runs by hand, outside the layers too
```

**Dependencies point inward only.** Code may import from its own layer and from the layers it points at, never
outward. The domain is the centre: it imports nothing but other domain code and the JavaScript standard library,
so it never sees Express, MongoDB or zod. That keeps the bar's rules in plain classes that can be read and tested
without a server or a database, and lets the outer layers change (another database, another web framework) without
touching them.

| Layer              | What it holds                                                                                                                                                                                           | May import                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **domain**         | Entities, value objects and aggregates; the rules they enforce; the errors they raise; the repository interfaces for each aggregate; facts about the bar that every rule shares, such as its time zone. | domain                                                            |
| **application**    | One service per aggregate, with a method per use case; the rules of admin access (`application/auth/`). The ports those services need from the outside world (the Clock, …).                            | domain, application                                               |
| **infrastructure** | Adapters that implement those ports and repository interfaces: MongoDB repositories and their document mappers, the clocks, the password check (bcrypt) and the session tokens (JWT).                   | domain, application, the library it adapts (MongoDB, bcrypt, JWT) |
| **interface**      | HTTP: routers and their handlers (the controllers), zod schemas for request bodies, CORS, the admin guard, turning errors into responses, and the Logger the error handler reports to.                  | domain, application, Express, zod                                 |
| **outer shell**    | `config.ts` (the env config), `composition-root.ts` (wiring), `main.ts` (the process), `scripts/` (tools the owner runs by hand).                                                                       | everything                                                        |

Interface and infrastructure never import each other: they only meet in the composition root.

A few consequences, each a choice the code makes on purpose:

- **Validation happens twice.** zod checks request bodies at the HTTP edge, so a client gets every problem, field by
  field, in one 400. The domain checks its invariants again in its own constructors (a Money is never negative,
  wherever it came from), because the domain never trusts that someone else checked.
- **Application services depend only on interfaces, never on an adapter.** A repository interface describes a
  collection of aggregates, which is a domain idea, so it lives in the domain next to its aggregate. Every other
  port (the Clock, the DatabaseProbe, the AdminPassword, …) is something the domain has no word for, so it lives in
  `application/ports/`, one folder for all of them, and the domain stays free of it. Infrastructure implements both
  kinds. The `Logger` is not a port: no use case logs, so it is declared in `interface/http/`, beside the error
  handler that uses it.
- **The domain never asks for the time.** Application services read the Clock and pass the moment in, so a domain
  rule such as "is this Event upcoming?" is a plain function of its arguments.
- **No Mongoose.** Its models mix persistence into the domain objects. The native driver keeps documents in
  infrastructure, and a mapper per aggregate translates between a document and a domain object.

## Where things go

| You're writing …                                                       | It goes in                                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| a value object or fact several aggregates share (Money, BAR_TIME_ZONE) | `src/domain/shared/`                                                |
| an aggregate, its entities, its rules and its repository interface     | `src/domain/<aggregate>/`, e.g. `src/domain/events/`                |
| a use case                                                             | a method of the aggregate's service, `src/application/<aggregate>/` |
| a port a use case needs (other than a repository interface)            | `src/application/ports/`                                            |
| a MongoDB repository and its document mapper                           | `src/infrastructure/mongo/`                                         |
| any other adapter for a port                                           | `src/infrastructure/<technology>/`, like `infrastructure/clock/`    |
| routes, their handlers and their zod request schemas                   | `src/interface/http/<resource>/`, like `interface/http/health/`     |
| a new error code, or the HTTP answer for a domain or application error | `src/interface/http/errors/`                                        |
| a new environment variable                                             | `src/config.ts`, and a described entry in `.env.example`            |
| wiring a new object                                                    | `src/composition-root.ts`                                           |
| a tool the owner runs by hand                                          | `src/scripts/`, started by an npm script in `package.json`          |

The folders today, with the health check and admin access as the examples:

```
src/
  main.ts                      the process: the real env config, real database, system clock, listen
  composition-root.ts          composeApp(): builds every object, by hand
  config.ts                    environment variables → a checked Config
  domain/
    shared/bar-time-zone.ts    BAR_TIME_ZONE: the bar keeps Sofia time (the first aggregate, Events, comes next)
  application/
    ports/clock.ts             Clock: where "now" comes from
    ports/database-probe.ts    DatabaseProbe: "can the database answer?"
    ports/admin-password.ts    AdminPassword: "is this the admin password?", and a fingerprint of it
    ports/session-tokens.ts    SessionTokens: a session's expiry and password fingerprint, into a signed token and back
    health/health-service.ts   the use case: "can the backend serve requests?"
    auth/admin-auth-service.ts the use cases: log in, check a session
    auth/failed-login-limit.ts the rule: 5 failed logins per address per 15 minutes
    auth/auth-errors.ts        what admin access refuses, and why
  infrastructure/
    clock/system-clock.ts      production: the machine's clock
    clock/fixed-clock.ts       tests: a clock that stands still until a test moves it on
    mongo/mongo-database-probe.ts   DatabaseProbe, answered by MongoDB's ping
    auth/bcrypt-admin-password.ts   AdminPassword, checked against the bcrypt hash in the env config
    auth/jwt-session-tokens.ts      SessionTokens as JSON Web Tokens signed with JWT_SECRET
  interface/http/
    http-app.ts                the Express app: the order every request passes through
    cors.ts                    CORS for the configured origins only
    validation.ts              parseBody(): a request body checked by its zod schema, or a 400 with details
    logger.ts                  Logger: where unexpected errors are reported
    errors/http-error.ts       the error format: codes, body, HttpError
    errors/to-http-error.ts    the one place an expected error gets its status and code
    errors/error-handler.ts    404 for unknown routes; the one place errors become responses
    health/health-router.ts    GET /health
    auth/login-router.ts       POST /auth/login
    auth/require-admin.ts      the guard in front of /admin
  scripts/
    hash-password.ts           npm run hash-password: the admin password → its bcrypt hash
tests/
  contract/                    the HTTP API of the composed app (Supertest)
  config/                      the environment, and starting the process
  scripts/                     the owner's scripts, run as processes
  support/                     the test harness
```

## The composition root

`composeApp({ config, db, clock, logger })` in `src/composition-root.ts` builds the whole object graph: the adapters
first, then the services that take them, then the routers that take the services. Every class says what it needs
in its constructor and stores it in a field; nothing reaches for a global, and nothing but this function decides
which implementation of a port is used. There is no DI container: a list of `new`s in one readable place is simpler
than a framework that does the same out of sight. Each slice adds its own three steps there: its repository, its
service, its router.

The four arguments are what differs between a real run and a test, so they come from outside:

- `main.ts` passes the env config read from `process.env`, a database from a real `MongoClient`, the system clock,
  and `console`.
- The tests pass a fresh database on an in-memory MongoDB, a fixed clock and a silent logger
  (`tests/support/test-backend.ts`). A test that needs time to pass (a session ending, a rate limit's window
  closing) keeps hold of its `FixedClock` and moves it on with `advance()`.
- A browser test harness can do the same and then `listen()` on a free port: one private backend per test, with its
  own data and its own moment in time. The backend needs no test-only routes for this.

Routers are mounted in the order `composeApp` lists them, behind the admin guard and before the 404 and the error
handler.

## Routes: who may call what

A route's path says who it is for, so who may call it is decided in one place, `http-app.ts`, and not again in
every router:

| Path          | For                                                                        | Token          |
| ------------- | -------------------------------------------------------------------------- | -------------- |
| `/admin/…`    | the admin panel: everything it reads and writes                            | Bearer, always |
| `/public/…`   | the site's guests: read-only content, such as the menu and upcoming Events | none           |
| `/auth/login` | whoever has the password: it is where an Admin gets a token                | none           |
| `/health`     | the host's health checks and the test harnesses                            | none           |

Every router writes its paths in full (`/public/…`, `/admin/…`), so a route's whole path can be read where it is
declared. The guard, `requireAdmin`, is mounted on the `/admin` prefix itself, ahead of the JSON body parser and
every router. So every path under `/admin` needs a token whether or not a route answers it: an admin route can't
be added without the guard, nobody without a token learns which admin routes exist (they get 401, never 404), and
no stranger's request body is parsed there. Paths outside `/admin` never look at the Authorization header.

## Admin access: where auth sits in the layers

There is one shared password and no user collection. Logging in proves you know the password; the token it gives
proves that for the next 8 hours, or until the password changes. Each layer does its own part:

- **domain: nothing.** No rule of the bar depends on who is asking: an Event is upcoming or not, whoever looks. So
  the domain never sees a password or a token, and its rules and tests are the same for every caller.
- **application: the rules.** `AdminAuthService` (`application/auth/`) holds the two use cases, `logIn(password,
  address)` and `checkSession(token)`, and decides everything about them: a session lasts 8 hours from the login,
  and ends sooner if the admin password changes; five failed logins from one address within 15 minutes of its
  first failure lock that address out until those 15 minutes are over (`FailedLoginLimit`); "now" is the Clock's.
  What it refuses, it throws as its own errors (`WrongPasswordError`, `TooManyFailedLoginsError` with the seconds
  left to wait, `InvalidSessionError`, `SessionExpiredError`), which know nothing of HTTP. It reaches the
  cryptography only through two ports: `AdminPassword` ("is this the password?", plus a fingerprint of it) and
  `SessionTokens` (write a session's expiry and password fingerprint into a signed token; read them back once the
  signature checks out).
- **infrastructure: the cryptography.** `BcryptAdminPassword` compares a password with the hash from the env config,
  and works out the hash's fingerprint. `JwtSessionTokens` signs and checks JSON Web Tokens (HS256, with
  `JWT_SECRET`). Neither decides anything.
- **interface: HTTP.** `loginRouter` checks the body's shape with zod and passes the password and the client's IP
  address to `logIn`; it marks its answer `Cache-Control: no-store`, since the token in it is as good as the
  password. `requireAdmin` takes the token out of the `Authorization: Bearer …` header and hands it to
  `checkSession`; when there is no token at all it throws the application's `InvalidSessionError` itself.
  `toHttpError` gives the application's errors their answers: 401 `WRONG_PASSWORD`, 429 `TOO_MANY_FAILED_LOGINS`
  with a `Retry-After` header (the seconds left to wait), and 401 `LOGIN_REQUIRED` for a missing, invalid or
  expired token alike, since either way the admin panel asks for the password again.
- **outer shell.** `config.ts` reads `JWT_SECRET`, `ADMIN_PASSWORD_HASH` and `TRUST_PROXY_HOPS`; the composition
  root wires the adapters into the service, and the service into the login router and the guard;
  `scripts/hash-password.ts` turns a password into the hash for the env config.

Choices worth knowing:

- **Time comes from the Clock, never from a library.** Left to itself, jsonwebtoken reads the machine's clock to
  stamp a token and to check its expiry; express-rate-limit's store reads it too and runs its own timers, with no
  way to hand it a clock. So `JwtSessionTokens` is given the Clock and hands jsonwebtoken its time, both to stamp a
  token and to check one; it checks only the signature, leaving "has this session ended?" to `checkSession`. The
  rate limit is a small class of our own that is told the time. That is what lets a test run a session, or a
  lock-out, to its end in milliseconds, by moving a `FixedClock` on.
- **A session ends on a whole second.** A JWT counts time in whole seconds, so `logIn` rounds the expiry down to
  one: the `expiresAt` an Admin is told is exactly when their token stops working, not up to a second later.
- **Changing the password ends every session.** When a staff member who knew the password leaves, the owner sets a
  new `ADMIN_PASSWORD_HASH` and restarts the backend; that alone must lock them out, even if they kept a token.
  So each token carries the fingerprint of the hash it was issued under, and `checkSession` refuses a token whose
  fingerprint isn't the current one. The fingerprint is 16 characters of an HMAC keyed with the hash, never the
  hash itself or a plain digest of it, because anyone holding a token can read what it carries. (The same password
  hashed again gets a new salt, so a new hash ends sessions even then.)
- **A failed login is counted before the password is checked.** bcrypt takes a moment, on purpose. Counted
  afterwards, ten guesses sent at once would all be checked before the first failure was recorded; counted first
  (and taken back when the password is right), no more than five ever are.
- **The plain password goes nowhere.** It isn't stored: the env config holds only its bcrypt hash, and auth has no
  repository. It isn't in the token, which carries only its issue and expiry times and the hash's fingerprint
  (which can't be worked back to the hash). It isn't logged: only
  unexpected errors are, never request bodies, and a login body the parser can't read is answered with a fixed
  message, because the parser's own message quotes the body back. The tests check what can be seen from outside:
  the backend's output after logins of every kind, and the token's readable contents.
- **Admin access keeps nothing in the database.** Failed-login counts are kept in memory, and sessions only in
  their tokens. Sessions can't be ended one by one: changing `ADMIN_PASSWORD_HASH` or `JWT_SECRET` (and
  restarting) ends them all.
- **Behind a reverse proxy, `TRUST_PROXY_HOPS` says how many there are.** A hosting platform's proxy makes every
  request arrive from the proxy's own address: with `TRUST_PROXY_HOPS=0` every client would share one count, and
  anyone's wrong guesses would lock every Admin out. Set to the number of proxies really in front, it lets Express
  read the client's address from `X-Forwarded-For`. It is a count, 0 when unset, and never "trust everything":
  believing a header no proxy wrote would let a client make up its address and escape the limit.

Known limits, accepted for now:

- **The window is fixed, not sliding.** It starts at an address's first failure and lasts 15 minutes, whatever
  happens in it; then the address starts again from nothing. A sliding window would need every failure's time kept,
  for little gain against a guesser held to five tries per quarter hour.
- **A successful login doesn't wipe earlier failures.** It takes back only its own count, so an Admin who got the
  password wrong twice and then right keeps those two failures until the window ends. Wiping them would be a second
  rule for something an Admin would hardly notice.
- **Failed-login counts live in memory.** A restart forgets them, which only lets an address try again sooner, and
  they are per process: run two backend processes and each counts on its own. The backend is assumed to run as one.
- **bcrypt reads only the first 72 bytes of a password.** Two passwords that share their first 72 bytes (72
  characters of plain ASCII, fewer with accented or Cyrillic letters) are the same password to it. A shared
  password the staff write down is far shorter than that.

## A request, end to end

`GET /health`, the simplest route, passes through every layer:

1. **interface**: `cors` adds the CORS headers if the Origin is allowed; `healthRouter` matches the route.
2. **application**: the handler calls `HealthService.check()`, which pings the database through the `DatabaseProbe`
   port and reads the time from the `Clock` port.
3. **infrastructure**: `MongoDatabaseProbe` runs MongoDB's `ping`; the clock is whichever one was composed.
4. **interface** again: the handler decides the wire format (instants as ISO 8601 in UTC) and sends
   `200 {"status":"ok","time":"2026-11-21T23:30:00.000Z","timeZone":"Europe/Sofia"}`.

If anything throws on the way (here: the database can't be reached), Express 5 hands the error to the error
handler, which answers 500 in the shared error format. Handlers never catch errors just to format them.

## Errors

Every error response, from every route, has the same JSON body:

```json
{ "code": "ROUTE_NOT_FOUND", "message": "There is no GET /no-such-route." }
```

- `code` is for programs: the site and the admin panel branch on it, never on the message. Every code is listed in
  the `ErrorCode` union in `src/interface/http/errors/http-error.ts`.
- `message` is for people: safe to show, never internals.
- `details` appears on validation failures only: a list of `{ "field": "title.en", "message": "…" }`, one entry per
  problem, so the admin panel can show each message next to its field.

| Status | When                                                    | Code today                          |
| ------ | ------------------------------------------------------- | ----------------------------------- |
| 400    | a request fails validation (with `details`)             | `VALIDATION_FAILED`                 |
| 400    | a JSON body that doesn't parse                          | `MALFORMED_JSON`                    |
| 401    | a wrong password at login                               | `WRONG_PASSWORD`                    |
| 401    | a missing, invalid or expired token on an admin route   | `LOGIN_REQUIRED`                    |
| 404    | no such route                                           | `ROUTE_NOT_FOUND`                   |
| 404    | no such id                                              | added with Events                   |
| 409    | a duplicate slug                                        | added with Categories and Cocktails |
| 413    | a body over 100 kB                                      | `BODY_TOO_LARGE`                    |
| 415    | a body the parser can't read otherwise (e.g. not UTF-8) | `UNREADABLE_BODY`                   |
| 429    | too many failed logins (with `Retry-After`)             | `TOO_MANY_FAILED_LOGINS`            |
| 500    | anything unexpected                                     | `INTERNAL_ERROR`                    |

The interface layer throws `HttpError`s, which already carry their status and body. The domain and application
layers throw their own errors, which know nothing of HTTP; `toHttpError` (`errors/to-http-error.ts`), which the
error handler calls, is the one place that translates them into an `HttpError`, along with the errors the JSON body
parser throws for a body it can't read. Anything it doesn't recognise is unexpected: it is logged with its
stack on the server, and the client gets 500 `INTERNAL_ERROR` with a fixed message, because the cause (a driver
error, a host name, a stack trace) helps an attacker and means nothing to a guest.

## CORS

The site calls the backend from another origin, with an `Authorization` header and with PUT and DELETE from the
admin panel, so the browser checks CORS on every call.

- Only the origins in `CORS_ORIGINS` (the site's own addresses) get `Access-Control-Allow-Origin`, and the answer to
  their preflight: methods GET, POST, PUT, DELETE; headers Authorization, Content-Type.
- Any other origin gets no CORS headers at all, so its browser won't hand the response to the page.
- `CORS_ALLOW_LOCALHOST=true` also allows `localhost` and `127.0.0.1` on any port, for development. It is off unless
  set, and `CORS_ORIGINS` refuses those addresses, so production never allows them by accident.
- `CORS_ORIGINS` accepts plain `http://` origins: if the host also serves the site without TLS, those guests'
  browsers send an `http://` Origin, and refusing it would leave them with an empty page.
- Every response carries `Vary: Origin`, allowed or not, so a shared cache never serves one origin's answer to
  another.
- Errors carry the same CORS headers as successes, so the site can read the error body.

## Time: the Clock port and the bar's time zone

"Now" comes from the `Clock` port (`src/application/ports/clock.ts`): `now()` gives the current instant, nothing
else. The bar's local date and time are that instant read in `BAR_TIME_ZONE` (`src/domain/shared/bar-time-zone.ts`),
Europe/Sofia, because "tonight" and "open until 02:00" mean Sofia time wherever the server runs. The zone is a fact
about the bar, not about a clock, so the domain owns it, once. Production uses `SystemClock`, the machine's clock.
Tests use `FixedClock`, stopped at Sunday 22 November 2026, 01:30 in Sofia, so every rule that depends on the time
is checked against a known moment (which events are upcoming, when a session expires, when a rate limit resets). A
test moves it on with `advance()` to let time pass inside one running backend. Nothing in `src/` reads the
machine's clock but `SystemClock`, and no library is left to read it either (see "Admin access" above).

## Tests

Tests check behaviour only through public boundaries, never internal classes, method calls or database documents,
so the code behind them can be refactored freely. Each test runs against the real composition root.

- **`tests/contract/`: the HTTP API.** The fully composed app, on a fresh database on an in-memory MongoDB and a
  fixed clock, exercised over HTTP with Supertest. These are the contract tests: what a client sends and what it
  gets back.
- **`tests/config/`: starting up.** The environment goes in; either a refusal comes out, naming every variable to
  fix, or a backend that runs. `src/main.ts` is started as a real process (under Node's own type stripping, so no
  build is needed) to check both. Each malformed value is then checked through `loadConfig` alone, because its
  `ConfigError` message is exactly what `main.ts` prints, and a process per case would be slow. What an accepted
  value does is checked on the running backend (the CORS tests compose the app with other origins), never by reading
  the `Config` that `loadConfig` returns: that object is internal, free to change shape.
- **`tests/scripts/`: the owner's scripts.** Each runs as a process, the way `npm run` starts it: input goes in,
  and its output and exit code are checked (the hash `hash-password` prints is then tried on a backend).
- Domain unit tests (value objects and aggregates, no HTTP and no database) arrive with the first aggregate.

`tests/support/global-setup.ts` starts one in-memory MongoDB per run; `createTestBackend()` gives each test its own
database on it and drops it when the test ends. No test touches a real database.

## TypeScript conventions

- **Imports name the `.ts` file you can see** (`import { loadConfig } from './config.ts'`). `tsc` rewrites them to
  `.js` when it builds, and Node can run the source as it is.
- **Only TypeScript that erases to plain JavaScript** (`erasableSyntaxOnly`): no `enum` (use a union of string
  literals, like `ErrorCode`), no `namespace`, and no constructor parameter properties. A class declares each
  dependency as a field and assigns it in its constructor, so what an object holds is always spelled out.
- **`import type`** for anything used only as a type (`verbatimModuleSyntax`), so nothing is loaded at runtime by
  accident.
- **A short "why" comment** wherever a choice isn't obvious from the code; no comments that repeat what the code says.
