import { test, expect } from './mockFixtures.js';
import { top250Order } from '../../mocks/data/movies.js';

/**
 * Test Case 2 — Navigate Top 250 Movies (against the deterministic mock).
 *
 * Home → open the menu → Top 250 → open the #1 movie → assert its title,
 * rating and release year are all shown.
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

    const detailsPage = await top250Page.openFirstMovie();

    await expect(detailsPage.title).toBeVisible();
    await expect(detailsPage.title).toHaveText(firstMovie.title);

    await expect(detailsPage.rating).toBeVisible();
    await expect(detailsPage.rating).toHaveText(firstMovie.rating);

    await expect(detailsPage.releaseYear).toBeVisible();
    await expect(detailsPage.releaseYear).toHaveText(firstMovie.year);
  });
});
