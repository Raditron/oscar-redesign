/**
 * The moment every test backend's clock starts at: Sunday 22 November 2026, 01:30 in Sofia (UTC+2), still Saturday's
 * ServiceNight. The backend's own tests stop their clock there (test-backend.ts), and so does the site's browser suite
 * (the repo root's tests/backend.js, which passes it to browser-backend.ts as --now). Plain data with no imports, so
 * the browser suite can load it without vitest.
 */
export const TEST_INSTANT = '2026-11-22T01:30:00+02:00';
