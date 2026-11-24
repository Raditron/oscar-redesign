// `npm run test:owner`: only the owner's finish line (OWNER_TESTS, in vitest.config.ts), on the same test harness.
import { defineConfig } from 'vitest/config';
import { OWNER_TESTS } from './vitest.config.ts';

export default defineConfig({
  test: {
    include: [OWNER_TESTS],
    globalSetup: ['tests/support/global-setup.ts'],
  },
});
