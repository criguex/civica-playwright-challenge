/**
 * Strongly-typed, framework-agnostic test configuration.
 *
 * Keeping environment access in a single module (instead of scattering
 * `process.env` reads across the suite) follows the Single Responsibility
 * Principle and makes the configurable surface obvious. Selecting an
 * environment is a first-class concept so the framework scales to dev/staging
 * without code changes: `TEST_ENV=staging npm test`.
 */
export type TestEnvironment = 'prod' | 'staging' | 'dev';

export interface TestConfig {
  /** Active logical environment. */
  readonly environment: TestEnvironment;
  /** Origin under test. The mock router intercepts requests to this origin. */
  readonly baseUrl: string;
}

const BASE_URL_BY_ENV: Record<TestEnvironment, string> = {
  prod: 'https://www.imdb.com',
  // Placeholders — wire real environments here as the project grows.
  staging: 'https://staging.imdb.example',
  dev: 'http://localhost:3000',
};

function resolveEnvironment(): TestEnvironment {
  const raw = (process.env.TEST_ENV ?? 'prod').toLowerCase();
  return raw in BASE_URL_BY_ENV ? (raw as TestEnvironment) : 'prod';
}

const environment = resolveEnvironment();

export const testConfig: TestConfig = {
  environment,
  // An explicit BASE_URL always wins over the per-environment default.
  baseUrl: process.env.BASE_URL ?? BASE_URL_BY_ENV[environment],
};
