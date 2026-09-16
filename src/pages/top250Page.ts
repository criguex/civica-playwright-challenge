import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage.js';
import { MovieDetailsPage } from './movieDetailsPage.js';
import { logger } from '../utils/logger.js';

/**
 * IMDb "Top 250 Movies" chart page.
 *
 * Ranked rows are labelled "1. <title>", "2. <title>", … so movies are
 * addressed by their accessible name rather than a positional CSS selector,
 * keeping the locators resilient to markup changes.
 */
export class Top250Page extends BasePage {
  private readonly heading: Locator;
  private readonly rankedLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = this.page.getByRole('heading', { name: /top 250 movies/i });
    // Every ranked entry ("1. …", "2. …", …) inside the main chart column.
    this.rankedLinks = this.page.getByRole('main').getByRole('link', { name: /^\d+\.\s/ });
  }

  /** Locator for the chart page heading. */
  get chartHeading(): Locator {
    return this.heading;
  }

  /** Locator matching every ranked movie link in the chart. */
  get rankedMovies(): Locator {
    return this.rankedLinks;
  }

  /** Locator for the first-ranked movie link. */
  get firstMovie(): Locator {
    return this.movieAtRank(1);
  }

  /** Locator for the movie at a given 1-based rank. */
  movieAtRank(rank: number): Locator {
    return this.page.getByRole('main').getByRole('link', { name: new RegExp(`^${rank}\\.\\s`) });
  }

  /** Number of ranked movies currently rendered. */
  async count(): Promise<number> {
    return this.rankedLinks.count();
  }

  /** The visible text of every ranked entry, in DOM order. */
  async rankedTitles(): Promise<string[]> {
    return this.rankedLinks.allInnerTexts();
  }

  /**
   * Opens the movie at the given rank (default: #1) and returns its details page.
   */
  async openMovieAtRank(rank = 1): Promise<MovieDetailsPage> {
    logger.step(`Opening movie #${rank} in the Top 250 chart`);
    await this.movieAtRank(rank).click();
    return new MovieDetailsPage(this.page);
  }
}
