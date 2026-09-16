import { type Locator, type Page } from '@playwright/test';
import { logger } from '../../utils/logger.js';

/**
 * The IMDb global header / navigation menu.
 *
 * Modelled as a *component* (not a page) because the header is shared by many
 * pages. Page Objects compose it instead of duplicating menu locators —
 * favouring composition over inheritance keeps each page focused on its own
 * responsibility.
 */
export class HeaderNav {
  private readonly menuButton: Locator;

  constructor(private readonly page: Page) {
    // IMDb labels the hamburger button "Open Navigation Menu".
    this.menuButton = this.page.getByRole('button', { name: /open navigation menu/i });
  }

  /** Opens the hamburger menu if it is not already open. */
  async open(): Promise<void> {
    logger.step('Opening the main navigation menu');
    await this.menuButton.click();
  }

  /**
   * Opens the menu and clicks through to the "Top 250 Movies" chart.
   * Encapsulates the full menu journey so tests read as a single intent.
   */
  async goToTop250(): Promise<void> {
    await this.open();
    logger.step('Selecting "Top 250 Movies" from the menu');
    await this.page.getByRole('link', { name: /top 250 movies/i }).click();
  }
}
