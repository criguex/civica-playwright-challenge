import { test as base } from '@playwright/test';
import { HomePage } from '../pages/homePage.js';
import { SearchResultsPage } from '../pages/searchResultsPage.js';
import { MovieDetailsPage } from '../pages/movieDetailsPage.js';
import { Top250Page } from '../pages/top250Page.js';

/**
 * Page Objects exposed as Playwright fixtures.
 *
 * Tests declare the pages they need in their arguments and receive ready-made
 * instances — a small dependency-injection container. This inverts control
 * (tests depend on abstractions, not on construction details) and removes
 * boilerplate `new SomePage(page)` calls from every spec.
 */
export interface PageObjects {
  homePage: HomePage;
  searchResultsPage: SearchResultsPage;
  movieDetailsPage: MovieDetailsPage;
  top250Page: Top250Page;
}

export const test = base.extend<PageObjects>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  searchResultsPage: async ({ page }, use) => {
    await use(new SearchResultsPage(page));
  },
  movieDetailsPage: async ({ page }, use) => {
    await use(new MovieDetailsPage(page));
  },
  top250Page: async ({ page }, use) => {
    await use(new Top250Page(page));
  },
});

export { expect } from '../support/customMatchers.js';
