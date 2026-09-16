import { test, expect } from '../../src/fixtures/pageFixtures.js';
import { isBotWallPresent } from '../../src/support/botWall.js';

/**
 * Test Case 2 — Navigate Top 250 Movies (against the live IMDb site).
 *
 * Home → menu → Top 250 → open the #1 movie → assert title, rating and year
 * are visible. Values are asserted by shape (not hard-coded) because the live
 * chart changes over time. Skips honestly if the anti-bot wall appears.
 */
test.describe('TC2 · Navigate Top 250 movies @e2e', () => {
  test('opens the #1 chart movie and validates title, rating and year', async ({
    homePage,
    top250Page,
    page,
  }) => {
    await homePage.open();
    test.skip(await isBotWallPresent(page), 'IMDb anti-bot wall detected — live E2E not runnable');

    await homePage.header.goToTop250();
    await expect(top250Page.chartHeading).toBeVisible();

    const detailsPage = await top250Page.openMovieAtRank(1);

    await expect(detailsPage.title).toBeVisible();
    await expect(detailsPage.rating).toBeVisible();
    await expect(detailsPage.releaseYear).toBeVisible();
    expect(await detailsPage.getReleaseYearNumber()).toBeValidReleaseYear();
  });
});
