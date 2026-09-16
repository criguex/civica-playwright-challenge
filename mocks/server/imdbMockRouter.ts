import { type Page, type Route } from '@playwright/test';
import { logger } from '../../src/utils/logger.js';
import {
  chartPage,
  findPage,
  homePage,
  movieByTitlePath,
  moviePage,
  notFoundPage,
} from './pageTemplates.js';

/**
 * Installs an in-process mock of IMDb by intercepting every request the page
 * makes and answering document requests with locally-rendered HTML.
 *
 * This is the fallback the challenge calls for: when the live site is
 * unavailable or bot-protected, the exact same Page Objects run against a
 * deterministic, offline replica. Non-document requests (images, fonts,
 * trackers) are short-circuited so nothing leaves the machine.
 */
export async function installImdbMock(page: Page): Promise<void> {
  logger.info('Installing IMDb mock router');
  await page.route('**/*', (route: Route) => {
    const request = route.request();

    if (request.resourceType() !== 'document') {
      return route.fulfill({ status: 200, body: '' });
    }

    const { pathname, searchParams } = new URL(request.url());
    const html = renderDocument(pathname, searchParams);

    return route.fulfill({
      status: html.status,
      contentType: 'text/html; charset=utf-8',
      body: html.body,
    });
  });
}

interface RenderedDocument {
  status: number;
  body: string;
}

/** Maps a requested path to the matching mock page. */
function renderDocument(pathname: string, searchParams: URLSearchParams): RenderedDocument {
  if (pathname === '/' || pathname === '') {
    return { status: 200, body: homePage() };
  }

  if (pathname.startsWith('/find')) {
    return { status: 200, body: findPage(searchParams.get('q') ?? '') };
  }

  if (pathname.startsWith('/chart/top')) {
    return { status: 200, body: chartPage() };
  }

  if (pathname.startsWith('/title/')) {
    const movie = movieByTitlePath(pathname);
    if (movie) {
      return { status: 200, body: moviePage(movie) };
    }
  }

  return { status: 404, body: notFoundPage(pathname) };
}
