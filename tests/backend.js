// The backend in the browser suite. The site fetches the bar's changing content (today the Saturday gig list) from its
// backend (backend/), so the suite runs real ones: the real composition root on an in-memory MongoDB, filled by the
// seed, with its clock stopped (backend/tests/support/browser-backend.ts). Never a real database, and the backend
// gets no test-only routes: tests change its data the way the admin panel does, through the admin API.
//
//   the shared backend     one for the whole run, started before the first test and stopped after the last
//                          (tests/shared-backend.js), for checks that only read. H.openPage points every page at it
//                          unless told otherwise.
//   a private backend      one per test, from the `privateBackend` fixture below, for a test that adds content, moves
//                          the clock or spends the login rate limit, so it never disturbs the tests running beside it.
//   closedBackendUrl()     an address nothing answers at: the backend is down.
//   a hanging backend      one per test, from the `hangingBackendUrl` fixture below: it takes every request and never
//                          answers.
//
// A page is pointed at a backend with window.OC_API, set before js/main.js runs (see H.openPage), never through the
// URL. A spec that needs a private backend takes `test` from here instead of from @playwright/test.
//
// Each backend's MongoDB keeps ~200 MB of data in a temp folder. The suite makes that folder and removes it once the
// backend's process has gone, however it went: stopped, ended outright, or crashed.
'use strict';
const { test: base, expect } = require('@playwright/test');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { freePort } = require('../backend/tests/support/free-port.ts');
const { ADMIN_PASSWORD } = require('../backend/tests/support/valid-env.ts');
// The moment every backend in the suite starts at, the backend's own tests' moment too: Sunday 22 November 2026, 01:30
// in Sofia, still Saturday's ServiceNight. Both Events the seed loads (31 October, 7 November) are past by then, so
// the shared backend lists no upcoming Events; a test that needs some adds them to a private backend.
const { TEST_INSTANT } = require('../backend/tests/support/test-instant.ts');

const BACKEND_DIR = path.resolve(__dirname, '..', 'backend');

const SOFIA_WALL_CLOCK = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Sofia', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});
/**
 * The suite's moment, or `ms` after it, on Sofia's wall clock as the page's ?now= takes it: suiteTime() is
 * '2026-11-22T01:30'. Where the page's clock and a backend's must agree, open the page with { now: suiteTime(ms) },
 * ms being how far that backend's clock has been moved on.
 */
function suiteTime(ms = 0) {
  const at = Object.fromEntries(SOFIA_WALL_CLOCK.formatToParts(Date.parse(TEST_INSTANT) + ms).map(p => [p.type, p.value]));
  return `${at.year}-${at.month}-${at.day}T${at.hour}:${at.minute}`;
}

const BACKEND_ARGS = ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', 'tests/support/browser-backend.ts', '--now', TEST_INSTANT];
/** What a backend prints once it is seeded and listening. */
const READY = /Backend for the browser suite: (?<url>http:\/\/\S+)/;

/** The shared backend's base URL: in process.env.OC_BACKEND_URL, which the test workers inherit from the run. */
function sharedBackendUrl() {
  const url = process.env.OC_BACKEND_URL;
  if (!url) throw new Error('No shared backend: run the suite through playwright.config.js, which starts it');
  return url;
}

/** A base URL nothing listens on (the backend's own freePort()), so a request is refused at once. */
async function closedBackendUrl() {
  return `http://127.0.0.1:${await freePort()}`;
}

/** A backend that hangs: it takes every request and never answers. Resolves to { url, stop() }. */
async function startHangingBackend() {
  const server = http.createServer(() => { /* never answers */ });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    stop() {
      server.closeAllConnections();
      return new Promise(resolve => server.close(resolve));
    }
  };
}

/** How long a private backend may take to start, MongoDB and the seed, on a busy machine. */
const STARTUP_LIMIT = 50_000;
/** How long it may take to stop once asked, before it is ended outright. */
const STOP_LIMIT = 10_000;

/**
 * Starts a backend of the caller's own: a fresh in-memory MongoDB, seeded, its clock at the suite's moment
 * (suiteTime()). Resolves to
 *   url                 its base URL, for H.openPage(page, path, { backend: url })
 *   password            the test-only admin password it accepts (backend/tests/support/valid-env.ts)
 *   logIn()             a session token, from POST /auth/login, for an Authorization: Bearer header
 *   addEvents(...e)     adds Events through POST /admin/events, as the admin panel does: { date, title: { bg, en }, entryFee }
 *   advanceClock(ms)    moves its clock on (a session expiring, a ServiceNight ending), and resolves once it has
 *   stop()              ends it, and resolves once its database's folder is gone
 * A backend that isn't ready within `startupLimit` is ended (mongodb-memory-server's own watcher then ends its mongod)
 * and the promise rejects, once the folder is gone.
 */
async function startBackend({ startupLimit = STARTUP_LIMIT } = {}) {
  // the database's folder, named as mongodb-memory-server names its own
  const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), 'mongo-mem-'));
  const child = spawn(process.execPath, [...BACKEND_ARGS, '--db-path', dbPath], { cwd: BACKEND_DIR, stdio: ['ignore', 'pipe', 'inherit', 'ipc'] });
  const exited = new Promise(resolve => child.once('exit', resolve));
  // A backend that stops removes the folder itself; one that is ended outright or crashes can't, so it goes here, once
  // the process has. Its mongod can outlive it for a moment (on Linux and macOS, until mongodb-memory-server's watcher
  // ends it, within 2 s) and still hold the files: hence the retries.
  const removed = exited.then(() => fs.promises.rm(dbPath, { recursive: true, force: true, maxRetries: 10 }));

  const url = await new Promise((resolve, reject) => {
    let out = '';
    child.stdout.on('data', chunk => { out += chunk; const ready = READY.exec(out); if (ready) resolve(ready.groups.url); });
    exited.then(code => reject(new Error(`the backend stopped before it was ready (exit code ${code})`)));
    setTimeout(() => reject(new Error(`the backend wasn't ready within ${startupLimit / 1000} s`)), startupLimit).unref();
  }).catch(async error => { child.kill(); await removed; throw error; });

  const send = async (route, init = {}) => {
    const res = await fetch(url + route, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`${init.method || 'GET'} ${route} answered ${res.status}: ${JSON.stringify(body)}`);
    return body;
  };
  const logIn = async () => (await send('/auth/login', { method: 'POST', body: JSON.stringify({ password: ADMIN_PASSWORD }) })).token;

  return {
    url,
    password: ADMIN_PASSWORD,
    logIn,
    async addEvents(...events) {
      const headers = { Authorization: `Bearer ${await logIn()}` };
      for (const event of events) await send('/admin/events', { method: 'POST', headers, body: JSON.stringify(event) });
    },
    advanceClock(ms) {
      return new Promise(resolve => {
        child.once('message', resolve);
        child.send({ advanceClockBy: ms });
      });
    },
    async stop() {
      if (child.connected) child.disconnect();   // it stops itself when the channel closes
      const outright = setTimeout(() => child.kill(), STOP_LIMIT);
      await exited;
      clearTimeout(outright);
      await removed;
    }
  };
}

const test = base.extend({
  /** A backend of this test's own (see startBackend), stopped when the test ends. Only a test that names it
   *  starts one; it gets its own time limit, room to start and to stop on a busy machine. */
  privateBackend: [async ({}, use) => {
    const backend = await startBackend();
    try { await use(backend); } finally { await backend.stop(); }
  }, { timeout: STARTUP_LIMIT + STOP_LIMIT }],
  /** The base URL of a backend that hangs (see startHangingBackend), for this test's length. */
  hangingBackendUrl: async ({}, use) => {
    const backend = await startHangingBackend();
    try { await use(backend.url); } finally { await backend.stop(); }
  }
});

module.exports = { test, expect, suiteTime, sharedBackendUrl, closedBackendUrl, startBackend };
