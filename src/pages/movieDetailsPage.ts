import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage.js';

/**
 * IMDb movie/title details page.
 *
 * Exposes the three facts both test cases assert on — title, rating and
 * release year — as {@link Locator}s (so tests own the assertions) plus
 * convenience readers. Locators are semantic: stable `data-testid`s that IMDb
 * ships, and an accessible-role locator for the year. No CSS/XPath.
 */
export class MovieDetailsPage extends BasePage {
  private readonly titleHeading: Locator;
  private readonly ratingScore: Locator;
  private readonly releaseYearLink: Locator;

  constructor(page: Page) {
    super(page);
    this.titleHeading = this.page.getByTestId('hero__pageTitle');
    this.ratingScore = this.page.getByTestId('hero-rating-bar__aggregate-rating__score');
    // The release year is rendered as a link (4 digits) in the title metadata.
    this.releaseYearLink = this.page.getByRole('link', { name: /^(19|20)\d{2}$/ }).first();
  }

  /** Locator for the movie title heading (`h1`). */
  get title(): Locator {
    return this.titleHeading;
  }

  /** Locator for the aggregate rating score. */
  get rating(): Locator {
    return this.ratingScore;
  }

  /** Locator for the release-year link. */
  get releaseYear(): Locator {
    return this.releaseYearLink;
  }

  /** Reads and trims the movie title text. */
  async getTitleText(): Promise<string> {
    return (await this.titleHeading.innerText()).trim();
  }

  /** Reads and trims the rating score text (e.g. "8.8"). */
  async getRatingText(): Promise<string> {
    return (await this.ratingScore.innerText()).trim();
  }

  /** Reads and trims the release-year text (e.g. "2010"). */
  async getReleaseYearText(): Promise<string> {
    return (await this.releaseYearLink.innerText()).trim();
  }
}
