import { test, expect } from '../../src/fixtures/mockFixtures.js';
import { top250Order } from '../../mocks/data/movies.js';

/**
 * Test Case 2 — Navigate Top 250 Movies (against the deterministic mock).
 *
 * Covers the required flow (menu → chart → #1 movie → validate) plus the
 * chart's structural integrity: the list is populated and correctly ranked.
 */
test.describe('TC2 · Navigate Top 250 movies @mock', () => {
  const firstMovie = top250Order[0];

  test('opens the #1 chart movie and validates title, rating and year', async ({
    homePage,
    top250Page,
  }) => {
    await homePage.open();
    await homePage.header.goToTop250();

    await expect(top250Page.chartHeading).toBeVisible();
    await expect(top250Page.firstMovie).toContainText(firstMovie.title);

    const detailsPage = await top250Page.openMovieAtRank(1);

    await expect(detailsPage.title).toBeVisible();
    await expect(detailsPage.title).toHaveText(firstMovie.title);

    await expect(detailsPage.rating).toBeVisible();
    await expect(detailsPage.rating).toHaveText(firstMovie.rating);

    await expect(detailsPage.releaseYear).toBeVisible();
    await expect(detailsPage.releaseYear).toHaveText(firstMovie.year);
  });

  test('renders a populated, correctly-ranked chart', async ({ homePage, top250Page }) => {
    await homePage.open();
    await homePage.header.goToTop250();

    await expect(top250Page.chartHeading).toBeVisible();
    await expect(top250Page.rankedMovies).toHaveCount(top250Order.length);

    const titles = await top250Page.rankedTitles();
    titles.forEach((entry, index) => {
      expect(entry).toContain(`${index + 1}.`);
      expect(entry).toContain(top250Order[index].title);
    });
  });
});
