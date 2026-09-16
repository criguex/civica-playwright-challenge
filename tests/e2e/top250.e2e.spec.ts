import { test, expect } from '../../src/fixtures/pageFixtures.js';

/**
 * Test Case 2 — Navigate Top 250 Movies (against the live IMDb site).
 *
 * Home → menu → Top 250 → open the #1 movie → assert title, rating and year
 * are visible. Values are asserted by shape (not hard-coded) because the live
 * chart changes over time.
 */
test.describe('TC2 · Navigate Top 250 movies @e2e', () => {
  test('opens the #1 chart movie and validates title, rating and year', async ({
    homePage,
    top250Page,
  }) => {
    await homePage.open();
    await homePage.header.goToTop250();

    await expect(top250Page.chartHeading).toBeVisible();

    const detailsPage = await top250Page.openFirstMovie();

    await expect(detailsPage.title).toBeVisible();
    await expect(detailsPage.rating).toBeVisible();
    await expect(detailsPage.releaseYear).toBeVisible();
    expect(await detailsPage.getReleaseYearText()).toMatch(/^(19|20)\d{2}$/);
  });
});
