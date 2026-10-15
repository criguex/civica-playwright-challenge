import { test, expect } from '../../src/fixtures/mockFixtures.js';
import { titlePath, inception } from '../../mocks/data/movies.js';

/**
 * Visual regression over the deterministic mock. Baselines are generated on
 * Linux, via the repo's Dockerfile, to match the CI runner — Playwright
 * already names snapshot files per-OS (`*-linux.png`), so a baseline taken
 * on a different platform is simply never picked up; it would only fail
 * locally on macOS/Windows without a baseline for that OS. See the "Visual
 * regression" section in README.md for the exact Docker command and the
 * opt-in rationale if this ever becomes flaky in CI.
 */
const pages = [
  { name: 'home', path: '/' },
  { name: 'search-results', path: '/find/?q=Inception' },
  { name: 'movie-details', path: titlePath(inception) },
  { name: 'top250-chart', path: '/chart/top/' },
];

test.describe('Visual regression @mock @visual', () => {
  for (const { name, path } of pages) {
    test(`${name} page matches its baseline`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
