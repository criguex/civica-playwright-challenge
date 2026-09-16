import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage.js';
import { MovieDetailsPage } from './movieDetailsPage.js';
import { logger } from '../utils/logger.js';

/**
 * IMDb "Top 250 Movies" chart page.
 *
 * Ranked rows are labelled "1. <title>", "2. <title>", … so the first movie is
 * addressed by its accessible name rather than a positional CSS selector,
 * keeping the locator resilient to markup changes.
 */
export class Top250Page extends BasePage {
  private readonly heading: Locator;
  private readonly firstRankLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = this.page.getByRole('heading', { name: /top 250 movies/i });
    this.firstRankLink = this.page
      .getByRole('main')
      .getByRole('link', { name: /^1\.\s/ })
      .first();
  }

  /** Locator for the chart page heading. */
  get chartHeading(): Locator {
    return this.heading;
  }

  /** Locator for the first-ranked movie link. */
  get firstMovie(): Locator {
    return this.firstRankLink;
  }

  /**
   * Opens the first-ranked movie and returns its details page.
   */
  async openFirstMovie(): Promise<MovieDetailsPage> {
    logger.step('Opening the #1 movie in the Top 250 chart');
    await this.firstRankLink.click();
    return new MovieDetailsPage(this.page);
  }
}
