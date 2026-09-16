import { expect as baseExpect } from '@playwright/test';

/**
 * Domain-specific assertions layered on top of Playwright's `expect`.
 *
 * Custom matchers make intent explicit and failures self-describing
 * (`expect(rating).toBeValidRating()` reads better than a raw range check and
 * prints a domain message when it fails). Import `expect` from here (the
 * fixtures re-export it) to get these matchers with full type-safety.
 */
export const expect = baseExpect.extend({
  /** Asserts a numeric value is a valid IMDb rating (0–10 inclusive). */
  toBeValidRating(received: number) {
    const pass = Number.isFinite(received) && received >= 0 && received <= 10;
    return {
      pass,
      name: 'toBeValidRating',
      expected: '0..10',
      actual: received,
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be a valid IMDb rating between 0 and 10`,
    };
  },

  /** Asserts a numeric value is a plausible film release year. */
  toBeValidReleaseYear(received: number) {
    const pass = Number.isInteger(received) && received >= 1888 && received <= 2100;
    return {
      pass,
      name: 'toBeValidReleaseYear',
      expected: '1888..2100',
      actual: received,
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be a plausible release year (1888–2100)`,
    };
  },
});
