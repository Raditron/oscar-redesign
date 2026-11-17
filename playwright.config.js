// Playwright config (dev only, not uploaded). `npm test` runs every tests/*.spec.js against the static pages,
// served from the repo root by tests/server.js exactly as the host serves them.
// `npm run test:dist` runs the same suite against the upload folder instead: it packages first, then sets
// SITE_ROOT=dist/oscarclubsofia.com, which tests/server.js serves in place of the repo root.
const { defineConfig, devices } = require('@playwright/test');

// Each checkout gets its own port (derived from its path), so several worktrees can run their suites at the same
// time without one testing another's files; the package run gets a port of its own too. Override with PORT=xxxx.
const hash = [...__dirname].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const PORT = Number(process.env.PORT) || 4200 + (hash % 700) + (process.env.SITE_ROOT ? 700 : 0);

const BASE = {
  baseURL: `http://localhost:${PORT}`,
  viewport: { width: 1440, height: 900 },
  // the visitor is NOT in Sofia: the open-now status must still be Sofia time
  timezoneId: 'America/New_York',
  locale: 'en-US'
};

module.exports = defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  use: BASE,
  // three engines. `npm test` runs Chromium only (fast); `npm run test:all` runs all three (Chromium, Firefox, WebKit).
  // The desktop device of each engine, at the suite's own viewport, timezone and locale
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...BASE } },
    // Firefox loads pages more slowly here when all three engines run in parallel: one page.goto timed out at 30s
    // in a full run, so it gets twice the time per test (a harness margin, not a site change)
    { name: 'firefox', use: { ...devices['Desktop Firefox'], ...BASE }, timeout: 60000 },
    { name: 'webkit', use: { ...devices['Desktop Safari'], ...BASE } }
  ],
  webServer: {
    // serves $SITE_ROOT when it is set (the web server inherits this process's environment), else the repo root
    command: `node tests/server.js ${PORT}`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: false
  }
});
