import { test, expect } from '@playwright/test';
import { INSECURE_COOKIE_NAME, SECURE_COOKIE_NAME } from '../../mocks/data/accountApp.js';
import { installAccountAppMock } from '../../mocks/server/accountAppMock.js';
import { checkBrowserCookies } from '../../src/audit/cookieAudit.js';
import { buildAuditReport } from '../../src/audit/types.js';
import { scanExchange, type CapturedExchange } from '../../src/audit/webExposureScanner.js';
import { writeAuditReport } from '../../src/audit/auditReportWriter.js';
import { logger } from '../../src/utils/logger.js';

/**
 * POC 1 — Web exposure audit (see docs/AUDIT-POC.md).
 *
 * Captures the traffic of a mock flow with `page.on('response')` — the same
 * capture point a real app audit would use (or a HAR, see the doc) — then
 * runs it through the scanner. One endpoint is deliberately vulnerable, the
 * other already fixed, so the test asserts both the detections and the
 * absence of false positives on the clean one.
 *
 * Cookie flags are audited separately, from `browserContext.cookies()`
 * rather than the captured `Set-Cookie` header: Chromium does not expose
 * that header back to `response.headers()` for a page's own network
 * traffic, mocked or not (see docs/AUDIT-POC.md "Límites"). A HAR capture or
 * a proxy does see the raw header, which is what `checkCookies()` consumes.
 */
test.describe('Web exposure audit · account dashboard mock @audit', () => {
  test('scans the captured traffic and flags the vulnerable endpoint only', async ({
    page,
    context,
  }) => {
    const pendingExchanges: Promise<CapturedExchange | null>[] = [];

    page.on('response', (response) => {
      const request = response.request();
      if (!['document', 'xhr', 'fetch'].includes(request.resourceType())) {
        return;
      }
      pendingExchanges.push(
        response
          .text()
          .then((responseBody) => ({
            url: response.url(),
            method: request.method(),
            status: response.status(),
            responseHeaders: response.headers(),
            responseBody,
          }))
          .catch(() => null),
      );
    });

    await installAccountAppMock(page);
    await page.goto('/dashboard');
    await expect(page.getByText('loaded', { exact: true })).toBeVisible();

    const captured = (await Promise.all(pendingExchanges)).filter(
      (exchange): exchange is CapturedExchange => exchange !== null,
    );
    expect(captured).toHaveLength(3);

    const browserCookies = await context.cookies();
    const cookieFindings = checkBrowserCookies(
      browserCookies.map((cookie) => ({
        name: cookie.name,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
      })),
      'browser cookie jar — /dashboard session',
    );

    const exchangeFindings = captured.flatMap(scanExchange);
    const report = buildAuditReport('Account dashboard mock — /dashboard flow', [
      ...exchangeFindings,
      ...cookieFindings,
    ]);
    writeAuditReport(report, 'web-exposure');
    logger.info(
      `Web exposure audit: ${report.findings.length} findings across ${captured.length} exchanges`,
    );

    const profileFindings = exchangeFindings.filter((finding) =>
      finding.location.includes('/api/account/profile'),
    );
    const safeFindings = exchangeFindings.filter((finding) =>
      finding.location.includes('/api/account/safe'),
    );
    const dashboardFindings = exchangeFindings.filter((finding) =>
      finding.location.includes('/dashboard'),
    );
    const insecureCookieFindings = cookieFindings.filter((finding) =>
      finding.id.includes(INSECURE_COOKIE_NAME),
    );
    const safeCookieFindings = cookieFindings.filter((finding) =>
      finding.id.includes(SECURE_COOKIE_NAME),
    );

    expect(safeFindings).toEqual([]);
    expect(safeCookieFindings).toEqual([]);

    expect(profileFindings.some((finding) => finding.category === 'pii-exposure')).toBe(true);
    expect(
      profileFindings.some(
        (finding) => finding.category === 'pii-exposure' && finding.severity === 'critical',
      ),
    ).toBe(true);
    expect(profileFindings.some((finding) => finding.category === 'secret-exposure')).toBe(true);
    expect(profileFindings.some((finding) => finding.category === 'missing-security-header')).toBe(
      true,
    );

    expect(
      dashboardFindings.some((finding) => finding.category === 'missing-security-header'),
    ).toBe(true);
    expect(insecureCookieFindings.some((finding) => finding.title.includes('Secure'))).toBe(true);
    expect(insecureCookieFindings.some((finding) => finding.title.includes('HttpOnly'))).toBe(true);
    // Chromium defaults an unset SameSite to "Lax", so the cookie-jar capture can't see that the
    // response never declared it — see docs/AUDIT-POC.md "Límites".
    expect(insecureCookieFindings.length).toBeGreaterThanOrEqual(2);
  });
});
