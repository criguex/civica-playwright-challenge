/**
 * Strongly-typed, framework-agnostic test configuration.
 *
 * Keeping environment access in a single module (instead of scattering
 * `process.env` reads across the suite) follows the Single Responsibility
 * Principle and makes the configurable surface obvious and easy to test.
 */
export interface TestConfig {
  /** Origin under test. The mock router intercepts requests to this origin. */
  readonly baseUrl: string;
}

const DEFAULT_BASE_URL = 'https://www.imdb.com';

export const testConfig: TestConfig = {
  baseUrl: process.env.BASE_URL ?? DEFAULT_BASE_URL,
};
