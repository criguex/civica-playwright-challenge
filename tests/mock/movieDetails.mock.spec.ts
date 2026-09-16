import { test, expect } from '../../src/fixtures/mockFixtures.js';
import { inception, titlePath } from '../../mocks/data/movies.js';

/**
 * Deep validation of the movie details page — the data quality a QA engineer
 * actually cares about: rating within range, plausible year, genres present,
 * runtime shown and a canonical URL. Uses the custom `toBeValid*` matchers.
 */
test.describe('Movie details · deep validations @mock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(titlePath(inception));
  });

  test('shows a title, rating, year, runtime and genres', async ({ movieDetailsPage }) => {
    await expect(movieDetailsPage.title).toHaveText(inception.title);
    await expect(movieDetailsPage.rating).toBeVisible();
    await expect(movieDetailsPage.releaseYear).toHaveText(inception.year);
    await expect(movieDetailsPage.runtime).toHaveText(inception.runtime);

    for (const genre of inception.genres) {
      await expect(movieDetailsPage.genre(genre)).toBeVisible();
    }
  });

  test('rating is a valid IMDb score (0–10)', async ({ movieDetailsPage }) => {
    expect(await movieDetailsPage.getRatingValue()).toBeValidRating();
  });

  test('release year is a plausible film year', async ({ movieDetailsPage }) => {
    expect(await movieDetailsPage.getReleaseYearNumber()).toBeValidReleaseYear();
  });

  test('lives at a canonical /title/<id>/ URL', async ({ movieDetailsPage }) => {
    expect(movieDetailsPage.url()).toContain(`/title/${inception.id}/`);
  });
});
