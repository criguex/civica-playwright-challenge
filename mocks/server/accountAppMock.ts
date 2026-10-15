import { type Page, type Route } from '@playwright/test';
import {
  INSECURE_COOKIE,
  INSECURE_RESPONSE_HEADERS,
  SECURE_COOKIE,
  SECURE_RESPONSE_HEADERS,
  renderDashboardHtml,
  renderProfileResponse,
  renderSafeResponse,
} from '../data/accountApp.js';

/**
 * Installs the fictitious "account dashboard" used by the web-exposure audit
 * POC (docs/AUDIT-POC.md). Same interception approach as
 * `imdbMockRouter.ts` — every request is answered in-process, offline.
 */
export async function installAccountAppMock(page: Page): Promise<void> {
  await page.route('**/*', (route: Route) => {
    const { pathname } = new URL(route.request().url());

    if (pathname === '/dashboard') {
      return route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        headers: { ...INSECURE_RESPONSE_HEADERS, 'set-cookie': INSECURE_COOKIE },
        body: renderDashboardHtml(),
      });
    }

    if (pathname === '/api/account/profile') {
      return route.fulfill({
        status: 200,
        headers: { ...INSECURE_RESPONSE_HEADERS },
        body: renderProfileResponse(),
      });
    }

    if (pathname === '/api/account/safe') {
      return route.fulfill({
        status: 200,
        headers: { ...SECURE_RESPONSE_HEADERS, 'set-cookie': SECURE_COOKIE },
        body: renderSafeResponse(),
      });
    }

    return route.fulfill({ status: 404, body: 'not found' });
  });
}
