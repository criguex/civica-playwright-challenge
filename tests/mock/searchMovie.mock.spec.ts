import { test, expect } from './mockFixtures.js';
import { inception } from '../../mocks/data/movies.js';

/**
 * Test Case 1 — Search and Validate Movie (against the deterministic mock).
 *
 * Home → search "Inception" → open the result → assert the details title
 * matches the search keyword.
 */
test.describe('TC1 · Search and validate movie @mock @smoke', () => {
  test('searches for a title and validates it on the details page', async ({
    homePage,
    searchResultsPage,
  }) => {
    await homePage.open();
    await homePage.searchFor(inception.title);

    const detailsPage = await searchResultsPage.openFirstResult(inception.title);

    await expect(detailsPage.title).toBeVisible();
    await expect(detailsPage.title).toHaveText(inception.title);
    expect(await detailsPage.getTitleText()).toBe(inception.title);
  });
});
