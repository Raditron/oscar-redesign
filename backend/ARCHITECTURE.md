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
```

**Dependencies point inward only.** Code may import from its own layer and from the layers it points at, never
outward. The domain is the centre: it imports nothing but other domain code and the JavaScript standard library,
so it never sees Express, MongoDB or zod. That keeps the bar's rules in plain classes that can be read and tested
without a server or a database, and lets the outer layers change (another database, another web framework) without
touching them.

| Layer              | What it holds                                                                                                                                                                                           | May import                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **domain**         | Entities, value objects and aggregates; the rules they enforce; the errors they raise; the repository interfaces for each aggregate; facts about the bar that every rule shares, such as its time zone. | domain                                  |
| **application**    | One service per aggregate, with a method per use case. The ports those services need from the outside world (the Clock, …).                                                                             | domain, application                     |
| **infrastructure** | Adapters that implement those ports and repository interfaces: MongoDB repositories and their document mappers, the clocks.                                                                             | domain, application, the MongoDB driver |
| **interface**      | HTTP: routers and their handlers (the controllers), zod schemas for request bodies, CORS, turning errors into responses, and the Logger the error handler reports to.                                   | domain, application, Express, zod       |
| **outer shell**    | `config.ts` (the env config), `composition-root.ts` (wiring), `main.ts` (the process).                                                                                                                  | everything                              |

Interface and infrastructure never import each other: they only meet in the composition root.

A few consequences, each a choice the code makes on purpose:

- **Validation happens twice.** zod checks request bodies at the HTTP edge, so a client gets every problem, field by
  field, in one 400. The domain checks its invariants again in its own constructors (a Money is never negative,
  wherever it came from), because the domain never trusts that someone else checked.
- **Application services depend only on interfaces, never on an adapter.** A repository interface describes a
  collection of aggregates, which is a domain idea, so it lives in the domain next to its aggregate. Every other
  port (the Clock, the DatabaseProbe) is something the domain has no word for, so it lives in `application/ports/`,
  one folder for all of them, and the domain stays free of it. Infrastructure implements both kinds. The `Logger` is
  not a port: no use case logs, so it is declared in `interface/http/`, beside the error handler that uses it.
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

The folders today, with the one feature the skeleton has (the health check) as the example:

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
    health/health-service.ts   the use case: "can the backend serve requests?"
  infrastructure/
    clock/system-clock.ts      production: the machine's clock
    clock/fixed-clock.ts       tests: a clock stopped at one moment
    mongo/mongo-database-probe.ts   DatabaseProbe, answered by MongoDB's ping
  interface/http/
    http-app.ts                the Express app: the order every request passes through
    cors.ts                    CORS for the configured origins only
    logger.ts                  Logger: where unexpected errors are reported
    errors/http-error.ts       the error format: codes, body, HttpError
    errors/error-handler.ts    404 for unknown routes; the one place errors become responses
    health/health-router.ts    GET /health
tests/
  contract/                    the HTTP API of the composed app (Supertest)
  config/                      the environment, and starting the process
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
  (`tests/support/test-backend.ts`).
- A browser test harness can do the same and then `listen()` on a free port: one private backend per test, with its
  own data and its own moment in time. The backend needs no test-only routes for this.

Routers are mounted in the order `composeApp` lists them, before the 404 and the error handler.

## A request, end to end

`GET /health`, the one route the skeleton has, passes through every layer:

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

| Status | When                                                     | Code today       |
| ------ | -------------------------------------------------------- | ---------------- |
| 400    | a request fails validation (with `details`)              | added with the first validated route |
| 401    | missing, invalid or expired token, or a wrong password   | added with admin auth |
| 404    | no such route                                            | `ROUTE_NOT_FOUND` |
| 404    | no such id                                               | added with Events |
| 409    | a duplicate slug                                         | added with Categories and Cocktails |
| 429    | too many failed logins                                   | added with admin auth |
| 500    | anything unexpected                                      | `INTERNAL_ERROR` |

The interface layer throws `HttpError`s, which already carry their status and body. The domain and application
layers throw their own errors, which know nothing of HTTP; the error handler (`errors/error-handler.ts`) is the one
place that translates them into an `HttpError`. Anything it doesn't recognise is unexpected: it is logged with its
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
is checked against a known moment, and so is every test that will depend on it (which events are upcoming, when a
session expires, when a rate limit resets).

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
