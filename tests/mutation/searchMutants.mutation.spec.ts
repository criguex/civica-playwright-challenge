/* eslint-disable playwright/no-conditional-in-test, playwright/no-conditional-expect */
import { test, expect } from '../../src/fixtures/mockFixtures.js';
import { inception, shawshankRedemption, theDarkKnight } from '../../mocks/data/movies.js';
import { generateSearchMutants } from '../../src/support/mutations.js';
import { loadInsights, prioritize } from '../../src/support/mutationInsights.js';
import { logger } from '../../src/utils/logger.js';

/**
 * Mutant search scenarios — the "future" coverage layer.
 *
 * Each golden seed title is expanded into a battery of mutated queries
 * (equivalent / boundary / negative). The set is then re-ordered using the
 * insights ledger from previous runs (loadInsights → prioritize), so
 * previously-weak and never-seen mutants run first. Outcomes are recorded by
 * the mutation-insights reporter, closing the learning loop.
 *
 * See docs/MUTATION-TESTING.md for the full rationale.
 */
const SEED_MOVIES = [inception, shawshankRedemption, theDarkKnight];
const insights = loadInsights();

for (const seed of SEED_MOVIES) {
  const mutants = prioritize(generateSearchMutants(seed.title), insights);
  logger.info(`Generated ${mutants.length} mutants for "${seed.title}"`);

  test.describe(`Mutant search · ${seed.title}`, () => {
    for (const mutant of mutants) {
      test(`${mutant.id} [${mutant.category}] → ${mutant.expectation} @mutant`, async ({
        homePage,
        searchResultsPage,
        page,
      }) => {
        await homePage.open();
        await homePage.searchFor(mutant.query);

        if (mutant.expectation === 'found') {
          const detailsPage = await searchResultsPage.openFirstResult(seed.title);
          await expect(detailsPage.title).toContainText(seed.title);
        } else {
          await expect(page.getByText(/no results found/i)).toBeVisible();
        }
      });
    }
  });
}
