import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../src/fixtures/mockFixtures.js';
import { titlePath, inception } from '../../mocks/data/movies.js';

/**
 * Accessibility smoke checks with axe-core. Running against the deterministic
 * mock keeps them stable and offline. We gate on `serious`/`critical`
 * violations — the ones that actually block assistive-tech users — which is a
 * pragmatic, non-flaky bar for a UI test suite.
 */
const BLOCKING_IMPACTS = new Set(['serious', 'critical']);

const pages = [
  { name: 'home', path: '/' },
  { name: 'search results', path: '/find/?q=Inception' },
  { name: 'movie details', path: titlePath(inception) },
  { name: 'Top 250 chart', path: '/chart/top/' },
];

test.describe('Accessibility @mock @a11y', () => {
  for (const { name, path } of pages) {
    test(`${name} has no serious/critical a11y violations`, async ({ page }) => {
      await page.goto(path);

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const blocking = results.violations.filter(
        (violation) => violation.impact && BLOCKING_IMPACTS.has(violation.impact),
      );

      expect(blocking, blocking.map((violation) => violation.id).join(', ')).toEqual([]);
    });
  }
});
