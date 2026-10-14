import { type Page } from '@playwright/test';
import { test, expect } from '../../src/fixtures/mockFixtures.js';
import { titlePath, inception } from '../../mocks/data/movies.js';

/**
 * Performance budgets over the deterministic mock — Navigation Timing /
 * basic Web Vitals, gated with deliberately generous thresholds. The mock is
 * fully offline and in-process, so these numbers are about catching a
 * regression that makes a page pathologically slow to parse/render, not
 * about measuring real-world network performance.
 */
const DOM_CONTENT_LOADED_BUDGET_MS = 4000;
const LOAD_EVENT_BUDGET_MS = 5000;

interface NavigationTiming {
  readonly domContentLoaded: number;
  readonly loadEvent: number;
}

async function readNavigationTiming(page: Page): Promise<NavigationTiming> {
  return page.evaluate(() => {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      loadEvent: nav.loadEventEnd - nav.startTime,
    };
  });
}

const pages = [
  { name: 'home', path: '/' },
  { name: 'search results', path: '/find/?q=Inception' },
  { name: 'movie details', path: titlePath(inception) },
  { name: 'Top 250 chart', path: '/chart/top/' },
];

test.describe('Performance budgets @mock @performance', () => {
  for (const { name, path } of pages) {
    test(`${name} loads within budget`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'load' });

      const timing = await readNavigationTiming(page);

      expect(timing.domContentLoaded).toBeGreaterThan(0);
      expect(timing.domContentLoaded).toBeLessThan(DOM_CONTENT_LOADED_BUDGET_MS);
      expect(timing.loadEvent).toBeGreaterThanOrEqual(timing.domContentLoaded);
      expect(timing.loadEvent).toBeLessThan(LOAD_EVENT_BUDGET_MS);
    });
  }
});
