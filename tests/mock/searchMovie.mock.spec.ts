import { test, expect } from '../../src/fixtures/mockFixtures.js';
import { NO_RESULTS_QUERY, searchableMovies } from '../../mocks/data/movies.js';

/**
 * Test Case 1 — Search and Validate Movie (against the deterministic mock).
 *
 * Beyond the single happy path, this covers the flow data-driven across the
 * whole catalogue, a case-insensitive variant, and a negative "no results"
 * path — the everyday coverage a real suite needs.
 */
test.describe('TC1 · Search and validate movie @mock', () => {
  test('searches for a title and validates it on the details page @smoke', async ({
    homePage,
    searchResultsPage,
  }) => {
    await homePage.open();
    await homePage.searchFor('Inception');

    const detailsPage = await searchResultsPage.openFirstResult('Inception');

    await expect(detailsPage.title).toBeVisible();
    await expect(detailsPage.title).toHaveText('Inception');
    expect(await detailsPage.getTitleText()).toBe('Inception');
  });

  for (const movie of searchableMovies) {
    test(`finds "${movie.title}" and opens the correct details page`, async ({
      homePage,
      searchResultsPage,
    }) => {
      await homePage.open();
      await homePage.searchFor(movie.title);

      const detailsPage = await searchResultsPage.openFirstResult(movie.title);

      await expect(detailsPage.title).toHaveText(movie.title);
    });
  }

  test('search is case-insensitive', async ({ homePage, searchResultsPage }) => {
    await homePage.open();
    await homePage.searchFor('iNcEpTiOn');

    const detailsPage = await searchResultsPage.openFirstResult('Inception');

    await expect(detailsPage.title).toHaveText('Inception');
  });

  test('shows no results for an unknown title', async ({ homePage, page }) => {
    await homePage.open();
    await homePage.searchFor(NO_RESULTS_QUERY);

    await expect(page.getByText(/no results found/i)).toBeVisible();
  });
});
