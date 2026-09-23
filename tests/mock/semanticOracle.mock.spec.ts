import { test, expect } from '../../src/fixtures/mockFixtures.js';
import {
  expectNotSemantic,
  expectSemantic,
  scoreAgainstCriteria,
} from '../../src/support/semanticOracle.js';
import { NO_RESULTS_QUERY } from '../../mocks/data/movies.js';

/**
 * Semantic oracle — asserting meaning instead of strings.
 *
 * Each block pairs the locator assertion we already have with the semantic one
 * that replaces it, so the trade-off is visible side by side rather than
 * described in a README. The locator assertions still run: Jev augments the
 * oracle, it does not replace deterministic checks that are cheap and stable.
 *
 * Run with TYPESAFE_API_KEY set for real decisions; without it the suite still
 * passes against a clearly-labelled lexical stub.
 */
test.describe('Semantic oracle @mock @jev', () => {
  test('recognises a no-results state regardless of the exact copy', async ({ homePage, page }) => {
    await homePage.open();
    await homePage.searchFor(NO_RESULTS_QUERY);

    await expect(page.getByText(/no results found/i)).toBeVisible();

    await expectSemantic(
      page,
      'The page tells the user that the search returned no matching titles',
    );
  });

  test('confirms the details page communicates the movie identity', async ({
    homePage,
    searchResultsPage,
    page,
  }) => {
    await homePage.open();
    await homePage.searchFor('Inception');
    const detailsPage = await searchResultsPage.openFirstResult('Inception');

    await expect(detailsPage.title).toHaveText('Inception');

    await expectSemantic(
      page,
      'The page presents a film titled Inception together with its rating and release year',
    );
  });

  test('asserts the happy path surfaces no error to the user', async ({
    homePage,
    searchResultsPage,
    page,
  }) => {
    await homePage.open();
    await homePage.searchFor('The Dark Knight');
    await searchResultsPage.openFirstResult('The Dark Knight');

    await expectNotSemantic(page, 'The page shows an error, warning or failure message');
  });

  test('rejects a claim that is false about the page @calibration', async ({
    homePage,
    searchResultsPage,
    page,
  }) => {
    await homePage.open();
    await homePage.searchFor('Inception');
    await searchResultsPage.openFirstResult('Inception');

    await expectNotSemantic(page, 'The page presents a film titled The Matrix, released in 1999');
  });

  test('scores the details page against its acceptance criteria', async ({
    homePage,
    searchResultsPage,
    page,
  }) => {
    await homePage.open();
    await homePage.searchFor('Inception');
    await searchResultsPage.openFirstResult('Inception');

    await scoreAgainstCriteria(
      page,
      [
        'Given a user opens a movie from the search results,',
        'the details page must display the movie title,',
        'its aggregate rating on a 0-10 scale,',
        'its release year,',
        'and at least one genre.',
      ].join(' '),
    );
  });
});
