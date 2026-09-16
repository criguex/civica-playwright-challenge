import { type Page } from '@playwright/test';
import { logger } from '../utils/logger.js';

/**
 * Abstract parent of every Page Object.
 *
 * It owns the Playwright `Page` handle and exposes the small set of
 * navigation/utility primitives shared by all pages. Concrete pages extend it
 * and are only responsible for their own locators and domain actions — an
 * application of the Single Responsibility and Open/Closed principles: shared
 * behaviour lives here and is extended, never modified, by subclasses.
 */
export abstract class BasePage {
  protected constructor(protected readonly page: Page) {}

  /**
   * Navigate to a path relative to the configured `baseURL`.
   * Waits for the DOM to be ready rather than every network resource, which is
   * both faster and more robust against third-party trackers that never settle.
   */
  async goto(path = '/'): Promise<void> {
    logger.step(`Navigating to "${path}"`);
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /** The current page URL. */
  url(): string {
    return this.page.url();
  }
}
