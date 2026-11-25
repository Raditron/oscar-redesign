// playwright.config.js's globalSetup: the shared backend (see tests/backend.js), started before the first test and
// stopped after the last, its database's folder with it. It is not a webServer entry: Playwright ends those by killing
// them (on Windows always), and a killed backend can't remove its database.
'use strict';
const { startBackend } = require('./backend');

module.exports = async function startSharedBackend() {
  // the first run downloads a mongod binary (~74 MB) into backend/node_modules/.cache
  const backend = await startBackend({ startupLimit: 5 * 60_000 });
  // the test workers inherit it (sharedBackendUrl())
  process.env.OC_BACKEND_URL = backend.url;
  return () => backend.stop();
};
