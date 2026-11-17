// `npm run test:dist`: build the upload (tools/package.js), then run the whole Playwright suite against
// dist/oscarclubsofia.com instead of the working tree. Extra arguments go to Playwright
// (e.g. `npm run test:dist -- tests/15-package.spec.js`). Dev-only, zero dependencies.
'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { build, SITE_DIR } = require('./package.js');

const REPO = path.resolve(__dirname, '..');
try { build({ log: s => console.log(s) }); } catch (e) { console.error(e.message); process.exit(1); }

const cli = require.resolve('@playwright/test/cli', { paths: [REPO] });
// Chromium, like `npm test`, unless the arguments name engines (`-- --project=firefox --project=webkit`)
const args = process.argv.slice(2);
if (!args.some(a => a.startsWith('--project'))) args.unshift('--project=chromium');
const run = spawnSync(process.execPath, [cli, 'test', ...args], {
  cwd: REPO, stdio: 'inherit', env: { ...process.env, SITE_ROOT: `dist/${SITE_DIR}` }
});
process.exit(run.status === null ? 1 : run.status);
