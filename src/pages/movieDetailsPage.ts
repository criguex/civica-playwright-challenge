import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage.js';

/**
 * IMDb movie/title details page.
 *
 * Exposes the facts the test cases assert on — title, rating, release year,
 * genres and runtime — as {@link Locator}s (so tests own the assertions) plus
 * typed convenience readers. Locators are semantic: stable `data-testid`s that
 * IMDb ships, and an accessible-role locator for the year. No CSS/XPath.
 */
export class MovieDetailsPage extends BasePage {
  private readonly titleHeading: Locator;
  private readonly ratingScore: Locator;
  private readonly releaseYearLink: Locator;
  private readonly genresContainer: Locator;
  private readonly runtimeItem: Locator;

  constructor(page: Page) {
    super(page);
    this.titleHeading = this.page.getByTestId('hero__pageTitle');
    this.ratingScore = this.page.getByTestId('hero-rating-bar__aggregate-rating__score');
    // The release year is rendered as a link (4 digits) in the title metadata.
    this.releaseYearLink = this.page.getByRole('link', { name: /^(19|20)\d{2}$/ }).first();
    this.genresContainer = this.page.getByTestId('genres');
    this.runtimeItem = this.page.getByTestId('title-runtime');
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

  /** Locator for the genres container. */
  get genres(): Locator {
    return this.genresContainer;
  }

  /** Locator for a single genre chip/link by its name. */
  genre(name: string): Locator {
    return this.genresContainer.getByRole('link', { name });
  }

  /** Locator for the runtime item. */
  get runtime(): Locator {
    return this.runtimeItem;
  }

  /** Reads and trims the movie title text. */
  async getTitleText(): Promise<string> {
    return (await this.titleHeading.innerText()).trim();
  }

  /** Reads the rating as a number (e.g. 8.8), for range assertions. */
  async getRatingValue(): Promise<number> {
    return Number.parseFloat((await this.ratingScore.innerText()).trim());
  }

  /** Reads the release year as a number (e.g. 2010). */
  async getReleaseYearNumber(): Promise<number> {
    return Number.parseInt((await this.releaseYearLink.innerText()).trim(), 10);
  }
}
