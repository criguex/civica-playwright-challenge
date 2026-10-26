import { defineConfig, devices } from '@playwright/test';
import { testConfig } from './src/config/testConfig.js';

/**
 * Central Playwright configuration.
 *
 * Projects keep the suite useful in every context:
 *  - `mock`     : deterministic, offline, always-green. IMDb requests are
 *                 intercepted by an in-process router (see mocks/server). This
 *                 is the default project and what CI runs. Includes the
 *                 accessibility checks.
 *  - `unit`     : pure-function tests of the learning ledger (order, forgetting,
 *                 corrupt file). No browser.
 *  - `mutation` : mutant search scenarios generated from golden flows and
 *                 prioritized from previous-run insights kept in `ledger/`.
 *  - `audit`    : security-audit-service POCs — web exposure scan, Android
 *                 static analysis, security mutants (see docs/AUDIT-POC.md).
 *                 Deterministic and offline, same as `mock`/`mutation`.
 *  - `api`      : API + contract tests against an in-process mock backend
 *                 (mocks/server/apiMockServer.ts), via Playwright `request` —
 *                 no browser. Deterministic and offline.
 *  - `performance` : Navigation Timing budgets over the mock. Deterministic
 *                 enough for CI thanks to generous thresholds.
 *  - `visual`   : `toHaveScreenshot` snapshots of the mock. Opt-in — see
 *                 "Visual regression" in README.md for the cross-platform
 *                 determinism caveat before wiring it into a new CI runner.
 *  - `e2e`      : hits the live IMDb site. Opt-in; skips honestly behind the
 *                 anti-bot wall.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
const isCi = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  maxFailures: isCi ? 0 : 10,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  /* Reporters: console + HTML + JUnit + the mutation-insights learning ledgers. */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['./reporters/mutationInsightsReporter.ts'],
    ['./reporters/auditMutationInsightsReporter.ts'],
  ],

  use: {
    baseURL: testConfig.baseUrl,
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
      name: 'unit',
      testDir: './tests/unit',
    },
    {
      name: 'mutation',
      testDir: './tests/mutation',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'audit',
      testDir: './tests/audit',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: './tests/api',
    },
    {
      name: 'performance',
      testDir: './tests/performance',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual',
      testDir: './tests/visual',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
