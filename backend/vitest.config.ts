import { configDefaults, defineConfig } from 'vitest/config';

/**
 * The owner's finish line: tests written before VenueSettings, Categories and Cocktails are, which fail until they
 * are. `npm run test:owner` runs only them (vitest.owner.config.ts); `npm test` leaves them out, so it stays green.
 * Once a file passes, renaming it from `*.owner.test.ts` to `*.test.ts` moves it into `npm test`.
 */
export const OWNER_TESTS = 'tests/**/*.owner.test.ts';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: [...configDefaults.exclude, OWNER_TESTS],
    globalSetup: ['tests/support/global-setup.ts'],
  },
});
