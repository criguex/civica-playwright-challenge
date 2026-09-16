import { defineConfig, devices } from '@playwright/test';

/**
 * Central Playwright configuration.
 *
 * Two projects are exposed so the suite is useful in every context:
 *  - `mock` : deterministic, offline, always-green. Requests to IMDb are
 *             intercepted by an in-process router (see mocks/server). This is
 *             the default project and what CI runs.
 *  - `e2e`  : hits the live IMDb site. Kept opt-in because third-party sites
 *             throttle/bot-protect automation and must never break the build.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
const baseUrl = process.env.BASE_URL ?? 'https://www.imdb.com';
const isCi = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  /* Run tests inside every file in parallel. */
  fullyParallel: true,
  /* Fail the build on CI if `test.only` was committed by accident. */
  forbidOnly: isCi,
  /* Retry only on CI to smooth over transient flakiness. */
  retries: isCi ? 2 : 0,
  /* Opt out of parallel workers on CI for stable, ordered logs. */
  workers: isCi ? 1 : undefined,
  /* Fail fast in local runs after a reasonable number of failures. */
  maxFailures: isCi ? 0 : 5,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  /* Reporters: readable console output + rich HTML + machine-readable JUnit. */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  /* Settings shared by every project. */
  use: {
    baseURL: baseUrl,
    /* Force English so IMDb copy and test-ids are deterministic. */
    locale: 'en-US',
    timezoneId: 'America/New_York',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'mock',
      testDir: './tests/mock',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
