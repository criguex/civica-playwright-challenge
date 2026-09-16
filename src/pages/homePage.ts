import { type Locator, type Page } from '@playwright/test';
import { BasePage } from './basePage.js';
import { HeaderNav } from './components/headerNav.js';
import { logger } from '../utils/logger.js';

/**
 * IMDb home page — the entry point for both user flows under test.
 */
export class HomePage extends BasePage {
  /** Shared header/menu component, composed rather than inherited. */
  readonly header: HeaderNav;

  private readonly searchBox: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderNav(page);
    // Located by its placeholder — a semantic, user-facing locator (no CSS/XPath).
    this.searchBox = this.page.getByPlaceholder('Search IMDb');
  }

  /** Opens the home page from the configured base URL. */
  async open(): Promise<void> {
    await this.goto('/');
  }

  /**
   * Types a query into the global search box and submits it, landing on the
   * find/results page.
   * @param query Movie title to search for, e.g. "Inception".
   */
  async searchFor(query: string): Promise<void> {
    logger.step(`Searching for "${query}"`);
    await this.searchBox.click();
    await this.searchBox.fill(query);
    await this.searchBox.press('Enter');
  }
}
