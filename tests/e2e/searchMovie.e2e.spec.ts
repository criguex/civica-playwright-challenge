import { test, expect } from '../../src/fixtures/pageFixtures.js';
import { isBotWallPresent } from '../../src/support/botWall.js';

/**
 * Test Case 1 — Search and Validate Movie (against the live IMDb site).
 *
 * Same Page Objects as the mock suite; only the backend differs. If IMDb serves
 * its anti-bot wall the test skips with a clear reason instead of failing —
 * an honest signal that the environment, not the code, is blocked.
 */
const MOVIE_TITLE = 'Inception';

test.describe('TC1 · Search and validate movie @e2e', () => {
  test('searches for a title and validates it on the details page', async ({
    homePage,
    searchResultsPage,
    page,
  }) => {
    await homePage.open();
    test.skip(await isBotWallPresent(page), 'IMDb anti-bot wall detected — live E2E not runnable');

    await homePage.searchFor(MOVIE_TITLE);

    const detailsPage = await searchResultsPage.openFirstResult(MOVIE_TITLE);

    await expect(detailsPage.title).toBeVisible();
    await expect(detailsPage.title).toContainText(MOVIE_TITLE);
    await expect(detailsPage.rating).toBeVisible();
  });
});
