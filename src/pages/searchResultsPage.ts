import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage.js';
import { MovieDetailsPage } from './movieDetailsPage.js';
import { logger } from '../utils/logger.js';

/**
 * IMDb "find" / search-results page.
 *
 * Its single responsibility is to expose the result list and let callers open
 * a specific title. It returns a {@link MovieDetailsPage}, chaining the flow
 * without leaking navigation details into the test.
 */
export class SearchResultsPage extends BasePage {
  private readonly resultsRegion: Locator;

  constructor(page: Page) {
    super(page);
    this.resultsRegion = this.page.getByRole('main');
  }

  /** A result link whose accessible name contains the given title. */
  private resultLink(title: string): Locator {
    return this.resultsRegion.getByRole('link', { name: new RegExp(escapeRegExp(title), 'i') });
  }

  /**
   * Clicks the first matching result and returns the details page it opens.
   * @param title Movie title to open, e.g. "Inception".
   */
  async openFirstResult(title: string): Promise<MovieDetailsPage> {
    logger.step(`Opening the first "${title}" result`);
    await this.resultLink(title).first().click();
    return new MovieDetailsPage(this.page);
  }
}

/** Escapes a string so it can be embedded safely inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
