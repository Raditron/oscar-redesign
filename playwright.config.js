// Playwright config (dev only, not uploaded). `npm test` runs every tests/*.spec.js against the static pages,
// served from the repo root by tests/server.js exactly as the host serves them.
const { defineConfig, devices } = require('@playwright/test');

// Each checkout gets its own port (derived from its path), so several worktrees can run their suites at the same
// time without one testing another's files. Override with PORT=xxxx.
const hash = [...__dirname].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const PORT = Number(process.env.PORT) || 4200 + (hash % 700);

module.exports = defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 900 },
    // the visitor is NOT in Sofia: the open-now status must still be Sofia time
    timezoneId: 'America/New_York',
    locale: 'en-US'
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: `node tests/server.js ${PORT}`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: false
  }
});
