# Backend architecture

The backend is the single source of truth for everything on the site that changes: the menu, the events, the bar's
hours and its contacts. It is a Node + TypeScript + Express application on MongoDB, deployed on its own host,
separately from the static site. The site fetches from it; the admin panel writes to it.

It is also a practice project in domain-driven design, so its structure is deliberate. This file explains that
structure: the four layers, the one rule between them, and where each kind of code goes. Then it walks through
Events, the first aggregate built through every layer, as the worked example to copy. The words it uses for the
bar's things (ServiceNight, Money, Event, …) are defined in [GLOSSARY.md](GLOSSARY.md).

## Running it

Needs Node 22.13 or newer. Everything happens in this folder. The site's browser suite at the repo root runs this
backend too (`tests/support/browser-backend.ts`), so it needs these dependencies installed; the site package
(`npm run package` at the root) ships nothing from here.

```
npm ci
npm test               # every test, on an in-memory MongoDB (the first run downloads a mongod binary, once)
npm run test:owner     # only the owner's finish line, which fails until the owner's slices are written
npm run typecheck      # tsc over src/ and tests/, no output
npm run build          # src/ → dist/
npm start              # runs dist/main.js, reading .env when there is one
npm run hash-password  # asks for the admin password (hidden) and prints its hash for ADMIN_PASSWORD_HASH
npm run seed -- --backend http://localhost:3000
                       # asks for the admin password and fills the running backend's empty database
                       # with the site's current content (--force: into one that has some, adding
                       # only what is missing)
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
   scripts/: tools run by hand · seed/: the seed one of them starts, a client of the admin API
   (both outside the layers too)
```

**Dependencies point inward only.** Code may import from its own layer and from the layers it points at, never
outward. The domain is the centre: it imports nothing but other domain code and the JavaScript standard library,
so it never sees Express, MongoDB or zod. That keeps the bar's rules in plain classes that can be read and tested
without a server or a database, and lets the outer layers change (another database, another web framework) without
touching them. `tests/architecture/dependencies.test.ts` reads every import in the four layers' folders (and in
`seed/`) and holds each layer to the "May import" column below, its layers and its packages alike, since a wrong
import would otherwise compile and run without anyone noticing. What a test of imports can't see is a global; the
domain uses two, both part of every JavaScript runtime rather than of Node or a library: `Intl`, to read an instant on
Sofia's clock, and `crypto.randomUUID()`, to give a new Event its id.

| Layer              | What it holds                                                                                                                                                                                           | May import                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **domain**         | Entities, value objects and aggregates; the rules they enforce; the errors they raise; the repository interfaces for each aggregate; facts about the bar that every rule shares, such as its time zone. | domain                                                                             |
| **application**    | One service per aggregate, with a method per use case, and the errors it raises; the rules of admin access (`application/auth/`). The ports those services need from the outside world (the Clock, …).  | domain, application                                                                |
| **infrastructure** | Adapters that implement those ports and repository interfaces: MongoDB repositories and their document mappers, the clocks, the password check (bcrypt) and the session tokens (JWT).                   | domain, application, the libraries it adapts (MongoDB, bcrypt, JWT, Node's crypto) |
| **interface**      | HTTP: routers and their handlers (the controllers), zod schemas for request bodies, CORS, the admin guard, turning errors into responses, and the Logger the error handler reports to.                  | domain, application, Express, zod                                                  |
| **outer shell**    | `config.ts` (the env config), `composition-root.ts` (wiring), `main.ts` (the process), `scripts/` (tools run by hand), `seed/` (the seed, a client of the admin API).                                   | everything, except `seed/`, which imports only its own files                       |

Interface and infrastructure never import each other: they only meet in the composition root.

A few consequences, each a choice the code makes on purpose:

- **Validation happens twice.** zod checks request bodies at the HTTP edge, so a client gets every problem, field by
  field, in one 400. The domain checks its invariants again in its own constructors (a Money is never negative,
  wherever it came from), because the domain never trusts that someone else checked.
- **Application services depend only on interfaces, never on an adapter.** A repository interface describes a
  collection of aggregates, which is a domain idea, so it lives in the domain next to its aggregate. Every other
  port (the Clock, the ScheduleProvider, the DatabaseProbe, …) is something the domain has no word for, so it lives
  in `application/ports/`, one folder for all of them, and the domain stays free of it. Infrastructure implements
  both kinds. The `Logger` is not a port: no use case logs, so it is declared in `interface/http/`, beside the error
  handler that uses it.
- **The domain never asks for the time.** Application services read the Clock and pass the moment in, so a domain
  rule such as "is this Event upcoming?" is a plain function of its arguments.
- **No Mongoose.** Its models mix persistence into the domain objects. The native driver keeps documents in
  infrastructure, and a mapper per aggregate translates between a document and a domain object.

## Where things go

| You're writing …                                                               | It goes in                                                          |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| a value object or fact several aggregates share (Money, LocalizedText, …)      | `src/domain/shared/`                                                |
| an aggregate, its entities, its rules and its repository interface             | `src/domain/<aggregate>/`, e.g. `src/domain/events/`                |
| a use case                                                                     | a method of the aggregate's service, `src/application/<aggregate>/` |
| an error a use case raises that isn't a domain rule (an unknown id)            | beside the service, `src/application/<aggregate>/`                  |
| a port a use case needs (other than a repository interface)                    | `src/application/ports/`                                            |
| a MongoDB repository and its document mapper                                   | `src/infrastructure/mongo/`                                         |
| any other adapter for a port                                                   | `src/infrastructure/<what it adapts>/`, like `clock/` or `auth/`    |
| routes, their handlers, their zod request schemas and their JSON answers       | `src/interface/http/<resource>/`, like `interface/http/events/`     |
| a new error code, or the HTTP answer for a domain or application error         | `src/interface/http/errors/`                                        |
| a new environment variable                                                     | `src/config.ts`, and a described entry in `.env.example`            |
| wiring a new object                                                            | `src/composition-root.ts`                                           |
| the site's content of one kind for the seed                                    | a step in `src/seed/steps/`, listed in `src/seed/seed.ts`           |
| a tool run by hand                                                             | `src/scripts/`, started by an npm script in `package.json`          |

The folders today:

```
src/
  main.ts                      the process: the real env config, real database, system clock, listen
  composition-root.ts          composeApp(): builds every object, by hand
  config.ts                    environment variables → a checked Config
  domain/
    shared/bar-time-zone.ts    BAR_TIME_ZONE: the bar keeps Sofia time
    shared/domain-error.ts     DomainError: what every refusal of a domain rule extends
    shared/money.ts            Money: whole euro cents, never negative
    shared/localized-text.ts   LocalizedText: Bulgarian and English, neither blank
    shared/calendar-date.ts    a day with no time or zone (an Event's date), and the Weekday
    shared/time-of-day.ts      HH:MM on the bar's wall clock (opening and closing times)
    shared/weekly-schedule.ts  DayHours and WeeklySchedule: the bar's hours
    shared/service-night.ts    ServiceNight: which of the bar's nights a moment belongs to
    events/event.ts            the Event aggregate
    events/event-lists.ts      which Events guests see, and the order Events are listed in
    events/event-repository.ts EventRepository: the interface to every Event
    shared/slug.ts, shared/position.ts, venue-settings/, categories/, cocktails/
                               declarations only, for the owner's slices (see "The owner's contract")
    shared/not-implemented-error.ts   what those declarations throw until they're written
  application/
    ports/clock.ts             Clock: where "now" comes from
    ports/schedule-provider.ts ScheduleProvider: the bar's WeeklySchedule
    ports/database-probe.ts    DatabaseProbe: "can the database answer?"
    ports/admin-password.ts    AdminPassword: "is this the admin password?", and a fingerprint of it
    ports/session-tokens.ts    SessionTokens: a session's expiry and password fingerprint, into a signed token and back
    events/event-service.ts    the use cases for Events
    events/event-errors.ts     what they refuse: an unknown id
    health/health-service.ts   the use case: "can the backend serve requests?"
    auth/admin-auth-service.ts the use cases: log in, check a session
    auth/failed-login-limit.ts the rule: 5 failed logins per address per 15 minutes
    auth/auth-errors.ts        what admin access refuses, and why
  infrastructure/
    clock/system-clock.ts      production: the machine's clock
    clock/fixed-clock.ts       tests: a clock that stands still until a test moves it on
    schedule/fixed-hours-schedule-provider.ts   ScheduleProvider, for now: the hours the site shows today
    mongo/mongo-event-repository.ts             EventRepository on MongoDB's `events` collection
    mongo/event-document.ts                     an Event's document, and the mapper both ways
    mongo/mongo-database-probe.ts               DatabaseProbe, answered by MongoDB's ping
    auth/bcrypt-admin-password.ts               AdminPassword, checked against the bcrypt hash in the env config
    auth/jwt-session-tokens.ts                  SessionTokens as JSON Web Tokens signed with JWT_SECRET
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
    events/events-router.ts    GET /public/events; GET, POST, PUT, DELETE /admin/events
    events/event-body.ts       the request body for an Event: zod schema → EventDetails
    events/event-json.ts       the answers: an Event as guests and as the admin panel get it
    pending-routes.ts          the owner's routes not written yet: 501 NOT_IMPLEMENTED
  seed/
    seed.ts                    seed(): the steps in order, and the refusal of a database that has content
    seed-step.ts               SeedStep: one kind of content
    collection-step.ts         a step for a kind there are many of, given what "the same" means for it
    admin-api.ts               the admin API as the seed calls it, over HTTP
    steps/events.ts            the two Events the site used to list
    steps/venue-settings.ts, steps/categories.ts, steps/cocktails.ts
                               the rest of the site's content, switched off until the owner's slices
  scripts/
    hash-password.ts           npm run hash-password: the admin password → its bcrypt hash
    seed.ts                    npm run seed: the seed, from the command line
    read-password.ts           how both take the password: from standard input, hidden at a terminal
tests/
  domain/                      the domain layer: value objects and aggregates, no HTTP, no database
  contract/                    the HTTP API of the composed app (Supertest)
  config/                      the environment, and starting the process
  scripts/                     the scripts, run as processes
  seed/                        the seed, called as a program calls it
  architecture/                the imports between the layers
  support/                     the test harness
```

## The worked example: Events, layer by layer

Events is the reference slice: the first aggregate built end to end, and the pattern VenueSettings, Categories and
Cocktails follow. An Admin adds, edits and deletes Events; guests see the next three upcoming ones. This section
goes from the centre outwards, one layer at a time, with the reason for each choice.

### 1. Domain: the bar's rules, in plain classes

**Value objects** (`src/domain/shared/`) each hold one value and the rules that make it valid: Money (whole euro
cents, never negative), LocalizedText (Bulgarian and English, neither blank), a calendar date, a time of day, a
weekday's DayHours, the WeeklySchedule.

- *Why a value object rather than a primitive.* A `number` can be −3, 14.999 or NaN; a `string` title can be blank.
  Every function that took one would have to check it again. A `Money` can only be made by `Money.ofCents`, which
  refuses those, so whoever holds a Money knows it is valid without looking.
- *How each is built.* A private constructor and a static factory (`Money.ofCents`, `LocalizedText.of`,
  `CalendarDate.parse`) that checks before it creates, so no instance skips the check. Fields are `readonly`: a
  value never changes, you make another. What it refuses, it throws as its own subclass of `DomainError`
  (`InvalidMoneyError`, `BlankTextError`, …), with a message written for people, so a test can name the exact rule.
- *What a factory checks, and what it trusts.* It checks what a type can't say: a blank string, a negative number,
  a day that opens and closes at the same time. What a type already says (a week has all seven days, an Event's
  details are value objects) the compiler holds every caller to, so it isn't checked a second time at runtime.
- *A state the type can't get wrong.* A DayHours is closed, or it has both times: its `times` is one value, null on a
  closed day, rather than two times that could each be missing, one without the other.
- *Why a calendar date and a time of day of our own.* A JavaScript `Date` is an instant, and the same instant falls
  on different days in different time zones: "31 October" kept as a Date at midnight can turn into the 30th when
  something reads it in UTC. An Event's date is a day in Sofia, so it is kept as a day, with no zone to be read in.

**ServiceNight** (`shared/service-night.ts`) is the rule that needs the time: `ServiceNight.at(instant, schedule)`
reads the instant on Sofia's clock and names the ServiceNight it belongs to. A moment after midnight and before the
previous day's closing time (when that day closes after midnight) belongs to the previous day's ServiceNight:
Sunday 01:30 is still Saturday's, but Monday 00:10 is Monday's, since Sunday closed at 23:30. A closed day carries
nothing past midnight, and neither does a day that closes at exactly 00:00. Both inputs are arguments, so the rule
never reads a clock or a database, and the same arguments always give the same ServiceNight: a test can try any
moment without waiting for it.

**The Event aggregate** (`events/event.ts`):

- *An entity, not a value object.* Two Events with the same date and title are still two Events, and an Event stays
  the same Event when an Admin edits it. Its `id` says which one it is.
- *Its own aggregate.* Nothing else has to change when an Event changes, and nothing inside it has an identity of its
  own (its date, title and entry fee are value objects). So it is the unit of change: loaded whole, edited through
  its own methods, saved whole, by its id. An aggregate with parts that do have identities (a Category's MenuItems)
  keeps them inside, reachable only through the root.
- *Two factories.* `Event.create(details)` makes a new Event with a new id (a random UUID, made by the domain, not by
  the database, so an Event never exists without one); `Event.restore(id, details)` is how the repository loads one
  back.
- *Behaviour, not just data.* `edit(details)` is the only way to change it; `isUpcomingOn(serviceNight)` answers
  whether it is upcoming: its date is on or after the ServiceNight's date. (Upcoming is not the same as shown:
  guests see at most three upcoming Events, so a fourth is upcoming and still not on the site.)
- *Its invariants live in its parts.* An Event built from value objects can't have a blank title or a negative fee,
  so it needs no checks of its own. An aggregate with a rule that spans several of its parts checks it in its own
  factory and methods, and throws a `DomainError` of its own.

**Rules about many Events at once** (`events/event-lists.ts`) are answered by no one Event, so they are plain
functions beside the aggregate, given the Events and the ServiceNight: a domain service, in DDD's words.
`upcomingShownToGuests` picks what guests see (at most three upcoming Events, soonest first) and `inAdminListOrder`
orders the admin panel's list (the upcoming ones soonest first, then the past ones latest first). An Event has no
start time, so two on the same date are put in the order of their ids: an order that means nothing, but is the
same on every load, so the three guests see never change while the Events don't.

**The repository interface** (`events/event-repository.ts`) sits in the domain beside its aggregate: "all the Events
there are" is a domain idea. It loads and saves whole Events and says nothing of MongoDB.

### 2. Application: the use cases

**`EventService`** (`application/events/event-service.ts`) has one method per use case: `upcomingForGuests`,
`listForAdmin`, `add`, `edit`, `delete`. It orchestrates and decides nothing itself: it works out the current
ServiceNight from the Clock and the ScheduleProvider, loads and saves through the EventRepository, and leaves the
rules to the domain: `event-lists.ts` picks and orders the Events, and each Event says whether it is upcoming. It
is handed domain values (`EventDetails`), never JSON, and hands back Events, or `ListedEvent`s: a read model of its
own, an Event with whether it is upcoming now, which is what the admin panel lists. What it refuses that isn't a
domain rule, an id no Event has, it throws as its own error, `EventNotFoundError`.

It loads every Event and filters them in memory rather than asking MongoDB for "date ≥ tonight". The bar has a few
Events a month, and this way the rule "upcoming" lives in one place, `Event.isUpcomingOn`, instead of a second copy
in a database query. If the list ever grows large, the repository is the place to narrow what it loads.

**The `ScheduleProvider` port** (`application/ports/schedule-provider.ts`) is "what are the bar's hours?". The service
needs the WeeklySchedule; where it comes from is not its business. *Why a port:* the hours belong to VenueSettings,
which an Admin will edit and the database will keep, but that slice isn't built yet. Today a temporary adapter
answers with the hours the site shows. When VenueSettings arrives, an adapter that reads them from there replaces it
in one line of the composition root, and neither the service nor its tests change. A port is written against what
the use case needs, not against what exists today.

### 3. Infrastructure: MongoDB, behind the interface

**`MongoEventRepository`** (`infrastructure/mongo/`) implements `EventRepository` with the native driver: one document
per Event in the `events` collection. `save` replaces the whole document, or adds it when there is none: the
aggregate is saved whole, and the last save wins.

**The mapper** (`mongo/event-document.ts`): `toEventDocument(event)` and `toEvent(document)`. *Why a mapper rather
than storing the Event as it is:* the document's shape is a storage decision (`_id`; `entryFeeCents`, with its
unit in the name; the date as `YYYY-MM-DD` text, because a BSON date is an instant and could shift the day), the
Event's shape is a domain decision. Translated in one place, either can change without the other, and no MongoDB
detail reaches the domain. The way back goes through the domain's own factories, so a document that breaks a rule
is refused rather than turned into an Event that can't exist. The mapper rethrows that refusal as an unexpected
error: the bad value came from the database, not from a client, so it must be logged and answered 500, never
mistaken for a client's invalid input (which a `DomainError` is answered as).

**`FixedHoursScheduleProvider`** (`infrastructure/schedule/`) is the temporary ScheduleProvider: the hours from
`OC.hours` in `js/main.js` (Mon–Wed and Sun 18:00–23:30, Thu until 02:00, Fri–Sat until 03:00), the same ones the
site's hours table and JSON-LD show.

### 4. Interface: HTTP at the edge

`src/interface/http/events/` holds three files, one job each:

- **`event-body.ts`: what comes in.** The zod schema of a request body checks every field at once, with a message
  for the Admin per field (`title.en`: "Enter the English title."); `parseBody` turns any failure into one 400
  `VALIDATION_FAILED` that lists them all in `details`. A body that passes is transformed into `EventDetails`, that
  is, domain value objects, which check the same rules again. So the HTTP layer translates the wire format in, and
  the application never sees JSON.
- **`event-json.ts`: what goes out.** A domain object never serialises itself: the HTTP layer decides the wire shape
  (see "The API's wire format" below), so the domain can change without changing the API. Guests get
  `PublicEventJson`; the admin panel gets `AdminEventJson`, which adds the id and whether the Event is upcoming.
- **`events-router.ts`: the routes.** Each handler reads the request, calls one use case and writes the answer. No
  rules, and no try/catch: whatever a use case throws goes to the error handler.

`errors/to-http-error.ts` gives the slice's errors their answers: `EventNotFoundError` → 404 `EVENT_NOT_FOUND`, and
any `DomainError` → 400 (see "Errors").

### 5. Wiring, seeding, testing

- **The composition root** gains the slice's three steps (the repository, the service, the router), plus the
  temporary ScheduleProvider.
- **The seed** gains a step, `src/seed/steps/events.ts`, with the two Events the site used to list, loaded through
  `POST /admin/events` like any Admin's. The step also says what makes an Event already there (the same date and
  title), for a forced run.
- **The tests**, at two seams. `tests/domain/` checks what the value objects and the Event allow and refuse, and
  ServiceNight across midnight and on closed days, with no HTTP, no database and no clock. `tests/contract/`
  (`admin-events.test.ts`, `public-events.test.ts`) checks the routes over HTTP against the composed app: what a
  client sends and what it gets back, including the Saturday Event still listed at Sunday 01:30 (the test clock's
  moment) and gone once the clock moves on to 03:00. A test that depends on the bar's hours says so by calling
  `givenBarHours(api)` (`tests/support/bar-hours.ts`) first; see "The VenueSettings slice replaces the temporary
  ScheduleProvider".

### A request through every layer: `PUT /admin/events/:id`

1. **interface**: `cors`, then `requireAdmin` checks the token; `express.json` reads the body; the router's
   handler checks it with `parseBody(EventBody, …)`, which answers 400 with `details` or hands back `EventDetails`.
2. **application**: `EventService.edit(id, details)` loads the Event, throws `EventNotFoundError` when there is
   none, edits it, saves it, and works out the current ServiceNight from the Clock and the ScheduleProvider.
3. **infrastructure**: `MongoEventRepository` finds the document and maps it to an Event (`toEvent`); saving maps it
   back (`toEventDocument`) and replaces the document.
4. **domain**: `event.edit(details)`; `ServiceNight.at(now, schedule)`; `event.isUpcomingOn(serviceNight)`.
5. **interface** again: `adminEventJson` shapes the answer: `200 {"id": …, "date": "2026-11-28", …, "upcoming": true}`.
   An `EventNotFoundError` on the way becomes 404 `EVENT_NOT_FOUND` in the error handler instead.

### Following the pattern for another aggregate

1. Check its words in [GLOSSARY.md](GLOSSARY.md), and use them in code and tests.
2. **domain**: its value objects (in `shared/` when other aggregates use them too); the aggregate in
   `src/domain/<aggregate>/`, with a private constructor, `create` and `restore` factories, methods for every
   change, and `DomainError` subclasses for what it refuses; its repository interface beside it; rules about many
   of them at once (which ones guests see, their order) in plain functions beside it, like `event-lists.ts`. (An
   aggregate with no identity to keep, such as VenueSettings, the one of its kind and replaced whole by every save,
   is built like a value object instead, with `of`: see its doc comment.)
3. **application**: its service, a method per use case, given ports and domain values only; its errors beside it.
4. **infrastructure**: its document type and mapper, and its MongoDB repository.
5. **interface**: its request schemas (transformed into domain values), its JSON answers, its router; its error
   codes in `ErrorCode` and their answers in `toHttpError`.
6. **composition root**: its repository, service and router.
7. **seed**: its step in `src/seed/steps/`, added to the list in `src/seed/seed.ts`, which decides what of its kind
   is already there (for a kind with a slug, the same slug) and adds only the rest. For a kind there are many of,
   `collectionStep` does the work, given the admin path, the content and what "the same" means (`sameSlug`).
8. **tests**: `tests/domain/` for its rules, `tests/contract/` for its routes.

## The composition root

`composeApp({ config, db, clock, logger })` in `src/composition-root.ts` builds the whole object graph: the adapters
first, then the services that take them, then the routers that take the services. Every class says what it needs
in its constructor and stores it in a field; nothing reaches for a global (beyond what every JavaScript runtime
provides, such as `Intl`), and nothing but this function decides
which implementation of a port is used. There is no DI container: a list of `new`s in one readable place is simpler
than a framework that does the same out of sight. Each slice adds its own three steps there: its repository, its
service, its router.

The four arguments are what differs between a real run and a test, so they come from outside:

- `main.ts` passes the env config read from `process.env`, a database from a real `MongoClient`, the system clock,
  and `console`.
- The tests pass a fresh database on an in-memory MongoDB, a fixed clock and a silent logger
  (`tests/support/test-backend.ts`). A test that needs time to pass (a session ending, a rate limit's window
  closing, a Saturday's ServiceNight ending) keeps hold of its `FixedClock` and moves it on with `advance()`.
- The site's browser suite does the same in `tests/support/browser-backend.ts`, a process of its own: an in-memory
  MongoDB, a `FixedClock` (moved on over the process's IPC channel), `listen()` on a free port, then `seed()`. The
  suite runs one shared backend for the whole run and a private one per test that needs its own data or its own
  moment in time (the repo root's `tests/backend.js`). The backend needs no test-only routes for this.

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

Every answer under `/public` carries `Cache-Control: no-cache`, set once on the prefix: a browser may keep it but
must ask again before every use, so an Admin who saves and reloads the site sees the change. Asking again is cheap:
Express tags each answer with an ETag, and the backend answers 304, with no body, while nothing has changed.

## The API's wire format

| A value …                      | crosses the API as …                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| a day (an Event's date)        | `"YYYY-MM-DD"`, a day in Sofia                                                       |
| an instant (a session's end)   | ISO 8601 in UTC, `"2026-11-22T07:30:00.000Z"`                                        |
| Money (a price, an entry fee)  | a whole number of euro cents, `1500` for 15 €; never a decimal                       |
| no value (free entry)          | an explicit `null`, in requests and answers alike: a missing field is a mistake      |
| LocalizedText                  | `{ "bg": "…", "en": "…" }`                                                           |
| a list                         | a JSON array, in the order the route promises                                        |

The Events routes:

| Route                       | Request body                         | Answer                                                                                                                                       |
| --------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /public/events`        | none                                 | 200 `[{ date, title, entryFee }]`: at most three upcoming Events, soonest first                                                              |
| `GET /admin/events`         | none                                 | 200 `[{ id, date, title, entryFee, upcoming }]`: every Event, the upcoming ones soonest first, then the past ones latest first               |
| `POST /admin/events`        | `{ date, title: { bg, en }, entryFee }` | 201 the new Event, `{ id, date, title, entryFee, upcoming }`; 400 `VALIDATION_FAILED`                                                     |
| `PUT /admin/events/:id`     | the same, replacing all three        | 200 the Event as it now is; 400 `VALIDATION_FAILED`; 404 `EVENT_NOT_FOUND`                                                                   |
| `DELETE /admin/events/:id`  | none                                 | 204, no body; 404 `EVENT_NOT_FOUND`                                                                                                          |

Every `/admin` route answers 401 `LOGIN_REQUIRED` without a valid token. `entryFee` is required in a request body:
a whole number of cents from 0 up, or `null` for free entry. A fee of 0 stays 0 and is not free entry (see the
glossary). In both lists, Events on the same date come in the order of their ids: an order that means nothing, but
is the same on every load.

## The owner's contract: VenueSettings, Categories, Cocktails

The three remaining aggregates are the owner's to build, by hand, one slice each: VenueSettings (#36), then
Categories (#37), then Cocktails (#38), following the Events slice above. Their finish line is written already:
tests that fail now and pass once the slice is done. What exists for them today, and nothing more:

- **Domain declarations** (`src/domain/venue-settings/`, `categories/`, `cocktails/`, and `shared/slug.ts`,
  `shared/position.ts`): the classes, factories, getters, methods and errors the tests use, with the rules each must
  enforce in its doc comment. Every member throws a `NotImplementedError` until it is written. They pin the
  vocabulary, not the inside: private fields, helper functions, the `restore` factory and repository interface
  each aggregate will need, and where "no two share a slug" is checked, are the owner's to design.
- **The pending routes** (`src/interface/http/pending-routes.ts`): each route below answers 501 `NOT_IMPLEMENTED`
  until written. Delete a route's entry when you implement it, and the file when the list is empty.
- **The tests**, named `*.owner.test.ts`, run by `npm run test:owner` and kept out of `npm test` (see `OWNER_TESTS`
  in `vitest.config.ts`). Each fails now for one reason: a `NotImplementedError`, or a 501 `NOT_IMPLEMENTED`. When a
  file passes, rename it to `*.test.ts`: it joins `npm test`, and stays green from then on.
- **The seed steps** (`src/seed/steps/venue-settings.ts`, `categories.ts`, `cocktails.ts`) hold the site's content and
  stay out of `SEED_STEPS` until their slice switches them on. `tests/seed/site-content.test.ts` checks their content
  against the pages today.

No controller, service, repository or mapper exists for them: those are the slices.

**Why a test fails.** Every owner test says so in its failure message, so read that before the test's code:

- `expectStatus` names what the backend answered instead: "expected 200, got 501 NOT_IMPLEMENTED: GET
  /public/cocktails is part of the API, but not implemented yet." Once the route exists, the same line shows a 400's
  field details ("got 400 VALIDATION_FAILED: … (slogan.bg: …)") or a 500, whose cause is in the backend's log.
- `expectValidationFailed` names the fields it looked for and the ones the backend named instead.
- `expectRefusal` lets anything but the expected refusal through as it is: the `NotImplementedError` of a member not
  written yet ("Volume.ofMillilitres is not implemented yet."), another rule's DomainError, or a TypeError.

### Routes

Every `/admin` route needs the token (401 `LOGIN_REQUIRED` without it); `/public` ones don't, and answer with
`Cache-Control: no-cache` like every public route. Bodies follow "The API's wire format" above: every field present,
none as a missing key, null where there is no value.

| Slice | Route                          | Request body       | Answer                                                                                         |
| ----- | ------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------- |
| #36   | `GET /public/venue-settings`   | none               | 200 VenueSettings; 404 `VENUE_SETTINGS_NOT_FOUND` until first saved                            |
| #36   | `GET /admin/venue-settings`    | none               | the same                                                                                       |
| #36   | `PUT /admin/venue-settings`    | VenueSettings      | 200 as saved (the first save creates them, every later one replaces them whole); 400           |
| #37   | `GET /public/categories`       | none               | 200 `{ shots, sets, spirits }`, each a list of public Categories, always all three             |
| #37   | `GET /admin/categories`        | none               | 200 `[admin Category]`, every one, hidden items included                                       |
| #37   | `POST /admin/categories`       | Category           | 201 the admin Category; 400; 409 `DUPLICATE_SLUG`                                              |
| #37   | `PUT /admin/categories/:id`    | Category           | 200 the admin Category as it now is; 400; 404 `CATEGORY_NOT_FOUND`; 409 `DUPLICATE_SLUG`       |
| #37   | `DELETE /admin/categories/:id` | none               | 204, no body; 404 `CATEGORY_NOT_FOUND`                                                         |
| #38   | `GET /public/cocktails`        | none               | 200 `[public Cocktail]`: the ones not hidden                                                   |
| #38   | `GET /admin/cocktails`         | none               | 200 `[admin Cocktail]`, hidden ones included                                                   |
| #38   | `POST /admin/cocktails`        | Cocktail           | 201 the admin Cocktail; 400; 409 `DUPLICATE_SLUG`                                              |
| #38   | `PUT /admin/cocktails/:id`     | Cocktail           | 200 the admin Cocktail as it now is; 400; 404 `COCKTAIL_NOT_FOUND`; 409 `DUPLICATE_SLUG`       |
| #38   | `DELETE /admin/cocktails/:id`  | none               | 204, no body; 404 `COCKTAIL_NOT_FOUND`                                                         |

**Two public menu reads, by the user's decision.** #29 planned one public "menu" read; the user replaced it with
`GET /public/cocktails` and `GET /public/categories` (#33's decisions). Each slice then owns its own route and its
own pending entry, the menu page asks for both at once, and the home page, which shows the Cocktails (carousel,
index) but not the Categories, asks for only what it shows.

### Shapes

```
VenueSettings  { weeklySchedule: { monday … sunday: { opensAt: "18:00", closesAt: "03:00" } | null },
                 happyHour: { from: "18:00", to: "20:00", discountPercent: 50 },
                 contacts: { reservationPhone: "+359 899 666 633", generalEmail: "oscarclub.sf@gmail.com",
                             eventsEmail: "events@oscarclubsofia.com", eventsPhone: "+359 883 30 50 55",
                             address: { bg, en }, mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=…",
                             instagramHandle: "oscarclub_official", facebookUrl: "https://www.facebook.com/OscarClub.sf" } }

Category (sent)     { slug, section: "shots" | "sets" | "spirits", name: { bg, en },
                      servingSize: { bg: "0,5 l", en: "0.5 l" } | null, position: 1…,
                      items: [{ id: string | null, name: { bg, en }, note: { bg, en } | null,
                                price: cents | null, hidden: boolean }] }
admin Category      the same, plus the Category's `id`, and every item's `id` (never null)
public Category     { slug, name, servingSize, items: [{ name, note, price }] }: visible items only, in order

Cocktail (sent)     { slug, name: "Tarator", slogan: { bg, en }, description: { bg, en }, ingredients: { bg, en },
                      imageAlt: { bg, en }, imagePath: "assets/img/cocktails/taratorw.webp", baseSpirit,
                      volumeMl: 280, price: cents, accentColour, featured: boolean, hidden: boolean, position: 1… }
admin Cocktail      the same, plus `id`
public Cocktail     the same without `id`, `hidden` and `position` (the list's order is the position)
```

- **Order.** Categories: each Section's by position. Cocktails: by position. Items: the order sent. Where positions
  are equal, any order, as long as it is the same on every load (an Event's list uses its ids; choose your own).
- **Items** belong to their Category. In a `PUT`, an item sent with its `id` stays that item, a `null` id makes a new
  one, and an item left out is removed. A `POST` has no items yet to name, so every id in it is null. An id the
  Category doesn't have, or the same id twice, is 400 `VALIDATION_FAILED`.
- **An unconfirmed price** is `null`; a price of `0` is a price. A Cocktail's price is never null.
- **The carousel copy lives on the Cocktail**, by the user's decision: `slogan` and `description` are required, so
  any Cocktail can be featured.
- **Validation** is 400 `VALIDATION_FAILED` with a `details` entry per problem, each with a message for the Admin,
  named by the field's path (`happyHour.discountPercent`, `weeklySchedule.saturday.closesAt`, `items.1.price`). A
  test asks only for a detail on the field it broke or on a field inside it, so a rule across fields (a day that
  opens and closes at the same time, a happy hour that doesn't start before it ends) may be reported on the object
  that holds them or on one of its fields.

### The rules, and why each is pinned

The declarations' doc comments say each rule in full. The tests pin only what #29 and the user's decisions ask for,
or what keeps the site working:

- **#29's model:** a Slug is lower-case Latin letters and digits with single hyphens between them, and unique among
  its kind (409); a Position is a whole number from 1; a HappyHour discount is a whole 1–100; LocalizedText is never
  blank in either language (so neither is a serving size, a slogan or a description); a Cocktail's name isn't
  blank, its volume is whole millilitres above 0, and its base spirit and accent colour come from `BASE_SPIRITS` and
  `ACCENT_COLOURS`.
- **Phones are international** (`+` and the country code): the site makes a `tel:` link of the digits, which dials
  the bar from a foreign phone only in that form. How the digits are grouped is left as written.
- **An Instagram handle is the handle, not a link:** the site builds the profile link, the message link and the "@…"
  from it.
- **Every contact is required, the general email, the Maps link and the Facebook page included** (the user's
  decision): the site then reads all of them from the backend, and none has to stay written in the HTML (#39).
- **A web link (the Maps link, the Facebook page) starts with `http://` or `https://`:** the site writes it into an
  `<a href>`, where a `javascript:` link would run on the bar's own page and a link without its scheme would lead to
  a page of the site that doesn't exist. Where it leads is the Admin's business.
- **A happy hour starts before it ends, on the same evening:** `OC.status` in js/main.js compares the minutes since
  that evening's midnight, so a window across midnight would never show on the open-now line.
- **An image path has no scheme and no host:** the site writes it into an `<img src>`, where a `javascript:` URL or
  another site's photo must never get. Whether the file exists is the site's business.

What the tests leave to you: the wording of every message, the order of `details` and of equal positions, whether a
rule across fields is reported on the object or on a field in it, and every internal (where uniqueness is checked,
how documents look, how the services are split).

### The VenueSettings slice replaces the temporary ScheduleProvider

`tests/contract/venue-settings-schedule.owner.test.ts` is what #36's dependency-inversion exercise must achieve: the
hours an Admin saves decide which Events are upcoming (Saturday's closing time moved to 23:00, and Saturday's Event
is gone at 01:30 on Sunday). Only the adapter behind `ScheduleProvider` changes, in the composition root; the Events
code stays as it is.

**Before the first save** there are no VenueSettings, and the user decided what that means: the venue reads answer
404 `VENUE_SETTINGS_NOT_FOUND`, and for Events no schedule means every day counts as closed, so an Event is upcoming
from its own date in Sofia (at 01:30 on Sunday, Saturday's Event is gone and Sunday's is listed). The seed always
creates VenueSettings, so a seeded backend never meets this.

**The Events tests stay unchanged.** Some of them expect the bar's hours (Saturday's Event still listed at 01:30 on
Sunday), and once the temporary adapter is gone a backend with no VenueSettings has none. So every Events test that
depends on the hours calls `givenBarHours(api)` (`tests/support/bar-hours.ts`) before it adds its Events. Today that
helper does nothing, because the temporary adapter already answers with the bar's hours; #36 makes it save the bar's
hours as VenueSettings through the admin API, and that helper's body is the only test code #36 changes for Events.
The owner's tests never call it, so they still meet a backend with no VenueSettings when they mean to (the 404s, the
calendar-day rule), and a test that saves its own hours (a closed Saturday) is never overwritten by it.

### Finishing a slice

1. Write the domain behind its declarations, replacing every `throw new NotImplementedError(…)`.
2. Build the slice through the layers, as "Following the pattern for another aggregate" above lists: its repository
   interface and `restore`, service, document mapper and repository, request schemas, JSON answers, router, and its
   error codes in `ErrorCode` and `toHttpError`.
3. Delete its entries from `pending-routes.ts`, and add its seed step to `SEED_STEPS`. (#36 also replaces the
   temporary ScheduleProvider in the composition root, and fills in `givenBarHours`, as above.)
4. Run `npm run test:owner` until its files pass, then rename them to `*.test.ts`; `npm test` must stay green.

| Slice | Needs first | Its tests | Its pending routes | Its seed step |
| ----- | ----------- | --------- | ------------------ | ------------- |
| #36   | nothing     | `tests/domain/`: `happy-hour`, `phone-number`, `email-address`, `instagram-handle`, `web-link`, `venue-settings`; `tests/contract/`: `admin-venue-settings`, `public-venue-settings`, `venue-settings-schedule`; `tests/seed/seed-venue-settings` | `GET /public/venue-settings`, `GET` and `PUT /admin/venue-settings` | `venueSettingsStep` |
| #37   | nothing     | `tests/domain/`: `slug`, `position`, `section`, `category`; `tests/contract/`: `admin-categories`, `public-categories`; `tests/seed/seed-categories` | `GET /public/categories`, `GET` and `POST /admin/categories`, `PUT` and `DELETE /admin/categories/:id` | `categoriesStep` |
| #38   | #37's Slug and Position | `tests/domain/`: `base-spirit`, `accent-colour`, `volume`, `image-path`, `cocktail`; `tests/contract/`: `admin-cocktails`, `public-cocktails`; `tests/seed/seed-cocktails` | `GET /public/cocktails`, `GET` and `POST /admin/cocktails`, `PUT` and `DELETE /admin/cocktails/:id` | `cocktailsStep` |

(Each name is `<name>.owner.test.ts` until renamed. The Cocktail tests build Slugs and Positions, so they can't pass
before #37's are written.)

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
- **Changing the password ends every session.** When a staff member who knew the password leaves, whoever runs the
  backend for the bar sets a new `ADMIN_PASSWORD_HASH` and restarts it; that alone must lock them out, even if they
  kept a token. So each token carries the fingerprint of the hash it was issued under, and `checkSession` refuses a
  token whose fingerprint isn't the current one. The fingerprint is 16 characters of an HMAC keyed with the hash,
  never the hash itself or a plain digest of it, because anyone holding a token can read what it carries. (The same
  password hashed again gets a new salt, so a new hash ends sessions even then.)
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
handler, which answers 500 in the shared error format. Handlers never catch errors just to format them. For a route
that also touches the domain, see `PUT /admin/events/:id` in the worked example above.

## Errors

Every error response, from every route, has the same JSON body:

```json
{ "code": "ROUTE_NOT_FOUND", "message": "There is no GET /no-such-route." }
```

- `code` is for programs, which branch on it, never on the message: the admin panel tells an Event deleted meanwhile
  (`EVENT_NOT_FOUND`) from a backend that has no such route (`ROUTE_NOT_FOUND`, an address set wrong), and the seed
  tells "no VenueSettings yet" (`VENUE_SETTINGS_NOT_FOUND`) from a failure. A client that only needs to know whether
  a call worked may go by the status alone, as the site does: any error leaves its part "unavailable". Every code is
  listed in the `ErrorCode` union in `src/interface/http/errors/http-error.ts`.
- `message` is for people: safe to show, never internals.
- `details` appears on validation failures found by a request's zod schema: a list of
  `{ "field": "title.en", "message": "…" }`, one entry per problem, so the admin panel can show each message next to
  its field.

| Status     | When                                                                           | Code today                      |
| ---------- | ------------------------------------------------------------------------------ | ------------------------------- |
| 400        | a request fails validation (with `details`)                                    | `VALIDATION_FAILED`             |
| 400        | a value the domain refuses got past validation (no `details`)                  | `VALIDATION_FAILED`             |
| 400        | a JSON body that doesn't parse                                                 | `MALFORMED_JSON`                |
| 400        | an id in the path with a %-escape that doesn't decode                          | `MALFORMED_URL`                 |
| 401        | a wrong password at login                                                      | `WRONG_PASSWORD`                |
| 401        | a missing, invalid or expired token on an admin route                          | `LOGIN_REQUIRED`                |
| 404        | no such route                                                                  | `ROUTE_NOT_FOUND`               |
| 404        | no Event with that id                                                          | `EVENT_NOT_FOUND`               |
| 413        | a body over 100 kB                                                             | `BODY_TOO_LARGE`                |
| 400 or 415 | a body the parser can't read otherwise (e.g. 415: not UTF-8), with its status  | `UNREADABLE_BODY`               |
| 429        | too many failed logins (with `Retry-After`)                                    | `TOO_MANY_FAILED_LOGINS`        |
| 500        | anything unexpected                                                            | `INTERNAL_ERROR`                |
| 501        | a route of the owner's slices that isn't written yet                           | `NOT_IMPLEMENTED` (scaffolding) |

Each aggregate names its own unknown id (`EVENT_NOT_FOUND`, and later `CATEGORY_NOT_FOUND` and `COCKTAIL_NOT_FOUND`;
`VENUE_SETTINGS_NOT_FOUND` before they're first saved), so a client knows what has gone without reading the
message, and never mistakes it for a route that doesn't exist. The owner's slices add these codes to `ErrorCode` as
they answer them (see "The owner's contract"), with one more: 409 `DUPLICATE_SLUG`, for a slug another of its kind
already has (#37, then #38).

The interface layer throws `HttpError`s, which already carry their status and body. The domain and application
layers throw their own errors, which know nothing of HTTP; `toHttpError` (`errors/to-http-error.ts`), which the
error handler calls, is the one place that translates them into an `HttpError`, along with the errors Express
throws for a request it can't read (a body the JSON parser can't parse, a route parameter that doesn't decode).
Anything it doesn't recognise is unexpected: it is logged with its stack on the server, and the client gets 500
`INTERNAL_ERROR` with a fixed message, because the cause (a driver error, a host name, a stack trace) helps an
attacker and means nothing to a guest.

Any `DomainError` is answered 400 `VALIDATION_FAILED` with the domain's own message. It is a backstop: every request
body is checked by its zod schema first, which names each field, so a DomainError only reaches HTTP when a schema
lets through a value the domain refuses. That is still the client's value, so still a 400, but without `details`,
since the domain doesn't know the request's field names (and a rule that spans several fields of an aggregate has
no one field to name). The fix is then to make the schema check it too, and the contract tests are what find it: a
test that sends the bad value and expects `details` naming its field fails until the schema checks it. (The Events
schema checks every rule its value objects do, so no Events request reaches the backstop.) A document in
the database that breaks a rule (edited by hand, or kept from before a rule was tightened) is not the client's
fault: its mapper rethrows the DomainError as an unexpected error, so it is logged and answered 500.

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
- Errors carry the same CORS headers as successes, so the site can read the error body. Every answer to an allowed
  origin also carries `Access-Control-Expose-Headers: Retry-After`, so the admin panel can say how long a 429 waits.

## Time: the Clock port, the bar's time zone and its hours

"Now" comes from the `Clock` port (`src/application/ports/clock.ts`): `now()` gives the current instant, nothing
else. The bar's local date and time are that instant read in `BAR_TIME_ZONE` (`src/domain/shared/bar-time-zone.ts`),
Europe/Sofia, because "tonight" and "open until 02:00" mean Sofia time wherever the server runs. The zone is a fact
about the bar, not about a clock, so the domain owns it, once. Production uses `SystemClock`, the machine's clock.
Tests use `FixedClock`, stopped at Sunday 22 November 2026, 01:30 in Sofia, so every rule that depends on the time
is checked against a known moment (which events are upcoming, when a session expires, when a rate limit resets). A
test moves it on with `advance()` to let time pass inside one running backend. Nothing in `src/` reads the
machine's clock but `SystemClock`, and no library is left to read it either (see "Admin access" above).

The bar's hours come from the `ScheduleProvider` port (`src/application/ports/schedule-provider.ts`) as a
WeeklySchedule. Together with the Clock's instant they give the current ServiceNight, which decides which Events are
upcoming. For now its adapter, `FixedHoursScheduleProvider`, returns the hours the site shows today; the
VenueSettings slice replaces it with one that reads the hours an Admin keeps. The site's open-now line follows the
same ServiceNight rule in the browser (`OC.nightOf` in `js/main.js`): a copy kept on purpose, so the line can
change without asking the server. When the rule changes, both copies change. Both are checked against the same
cases: `tests/support/service-night-cases.ts` holds them as plain data (a moment in Sofia, written the way the site's
`?now=` override takes it, and the date of its ServiceNight), which the domain tests run, and so does the site's
week of hours (`tests/11-night.spec.js` at the repo root: the page marks the ServiceNight's weekday).

## The seed

`seed()` in `src/seed/seed.ts` fills an empty database with the site's current content, so nothing is lost in the
move and every environment starts from the real content. `npm run seed -- --backend <url>` runs it from the command
line; a program (the browser suite) imports and calls it.

- **It goes through the admin API**, logging in with the admin password and adding content the way the admin panel
  does, never writing to MongoDB. Seeded content passes the same checks as an Admin's edits, and the seed needs only
  the backend's address and the password: no database connection, and no import from the rest of the backend (its
  layers, the composition root, the env config), so it is one more client of the API. It uses Node's own `fetch`,
  and nothing from the repo root's package.
- **It refuses a database that has content**, before loading anything: each step checks whether its kind of content
  is already there, and if any is, `seed()` throws `SeedRefusedError` and the script says so and exits with 1.
- **Forced, it adds only what is missing.** With `--force` (or `force: true`) each step adds the site's content that
  isn't there yet and skips what is, and says how many it added and skipped. It never changes or deletes anything,
  so a forced run against production by mistake can't destroy what an Admin has entered, and a second run adds
  nothing twice.
- **It is a list of steps, in order** (`SeedStep`, one per kind of content, in `src/seed/steps/`). Each step decides
  what counts as already there, since only it knows what makes two of its kind the same: for an Event, the same date
  and title (the fee isn't compared, so an Admin's correction stays); for a kind with a slug, the same slug. The
  events step holds the two Events the site used to list (2026's 31 October and 7 November, so both are past). A
  step that is written but not switched on yet, because its admin routes don't exist, stays out of the list until
  they do.
- **The password** is read from standard input, hidden at a terminal (`scripts/read-password.ts`, shared with
  `hash-password`), sent once to `POST /auth/login`, and neither kept nor printed.

## Tests

Tests check behaviour only through public boundaries, never internal classes, method calls or database documents,
so the code behind them can be refactored freely. Each test runs against the real composition root, or the real
domain objects.

- **`tests/domain/`: the domain layer.** Value objects and aggregates on their own, with no HTTP, no database and no
  clock: what each allows and what it refuses (each refusal checked by its own error class), ServiceNight across
  midnight and on closed days, and when an Event is upcoming. A moment is an argument here, never "now".
- **`tests/contract/`: the HTTP API.** The fully composed app, on a fresh database on an in-memory MongoDB and a
  fixed clock, exercised over HTTP with Supertest. These are the contract tests: what a client sends and what it
  gets back. Content a test needs is added through the admin API, as an Admin would, never written to the database.
- **`tests/config/`: starting up.** The environment goes in; either a refusal comes out, naming every variable to
  fix, or a backend that runs. `src/main.ts` is started as a real process (under Node's own type stripping, so no
  build is needed) to check both. Each malformed value is then checked through `loadConfig` alone, because its
  `ConfigError` message is exactly what `main.ts` prints, and a process per case would be slow. What an accepted
  value does is checked on the running backend (the CORS tests compose the app with other origins), never by reading
  the `Config` that `loadConfig` returns: that object is internal, free to change shape.
- **`tests/scripts/`: the scripts.** Each runs as a process, the way `npm run` starts it: input goes in, and its
  output and exit code are checked (the hash `hash-password` prints is then tried on a backend). The `seed` script's
  tests check only what the command line adds (its options, its messages, its exit codes); what the seed loads,
  skips and refuses is checked once, in `tests/seed/`, since each process takes a second or more to start.
- **`tests/seed/`: the seed as a program calls it**, against a backend listening on a local port
  (`startTestBackend()`). One exception, for now: the steps whose routes the owner hasn't written can't load into
  a backend yet, so `site-content.test.ts` hands each one an admin API that answers as an empty backend would, and
  checks what the step sends against the pages. Once a step is switched on, `seed-*.owner.test.ts` checks it end
  to end as well.
- **`tests/architecture/`: the imports.** The one test that reads source files: it holds each layer to the "May
  import" column of the table above, layers and packages alike, and keeps the seed a client of the API: it may
  import only its own files.

Helpers in `tests/support/` say what went wrong rather than only that something did, and every aggregate's tests use
them, the Events tests as much as the owner's: `expectStatus(response, 201)` fails with what the backend answered
instead ("expected 201, got 400 VALIDATION_FAILED: … (price: …)"); `expectValidationFailed(response, ['price'])`
expects a 400 with a detail, and a message, on each field named; and `expectRefusal(act, InvalidSlugError)` expects
one rule's own DomainError and throws anything else on as it is. `asAdmin()` gives a test a backend and an Admin's
Authorization header for it. A file named `*.owner.test.ts` is the owner's finish line (see "The owner's contract"),
run by `npm run test:owner` only.

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
