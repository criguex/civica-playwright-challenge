import { test, expect } from '../../src/fixtures/pageFixtures.js';

/**
 * Test Case 1 — Search and Validate Movie (against the live IMDb site).
 *
 * Same Page Objects as the mock suite; only the backend differs. Kept opt-in
 * (`npm run test:e2e`) because third-party availability/bot-protection must
 * never break the build.
 */
const MOVIE_TITLE = 'Inception';

test.describe('TC1 · Search and validate movie @e2e', () => {
  test('searches for a title and validates it on the details page', async ({
    homePage,
    searchResultsPage,
  }) => {
    await homePage.open();
    await homePage.searchFor(MOVIE_TITLE);

    const detailsPage = await searchResultsPage.openFirstResult(MOVIE_TITLE);

    await expect(detailsPage.title).toBeVisible();
    await expect(detailsPage.title).toContainText(MOVIE_TITLE);
  });
});
