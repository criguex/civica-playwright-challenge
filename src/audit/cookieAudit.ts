import type { AuditFinding } from './types.js';

/**
 * Flags cookies missing the three flags that keep them from being read by
 * script, sent over plain HTTP, or replayed cross-site: `Secure`, `HttpOnly`
 * and `SameSite`.
 *
 * Two entry points feed the same checks: `checkCookies()` parses a raw
 * `Set-Cookie` header value (one cookie per line) — what a HAR entry or a
 * proxy capture hands over for a *real* app. `checkBrowserCookies()` takes
 * Playwright's own cookie-jar shape (`browserContext.cookies()`), because
 * Chromium does not expose `Set-Cookie` back to `response.headers()` for
 * automation — see docs/AUDIT-POC.md "Límites" for why the mock demo reads
 * cookies that way instead.
 */
interface ParsedCookie {
  readonly name: string;
  readonly secure: boolean;
  readonly httpOnly: boolean;
  readonly sameSite?: string;
}

export interface BrowserCookie {
  readonly name: string;
  readonly secure: boolean;
  readonly httpOnly: boolean;
  readonly sameSite?: string;
}

function parseSetCookie(line: string): ParsedCookie {
  const [pair, ...attributes] = line.split(';').map((part) => part.trim());
  const name = pair.split('=')[0] ?? pair;
  const lowerAttributes = attributes.map((attribute) => attribute.toLowerCase());

  const sameSiteAttribute = lowerAttributes.find((attribute) => attribute.startsWith('samesite'));
  const sameSite = sameSiteAttribute?.split('=')[1]?.trim();

  return {
    name,
    secure: lowerAttributes.includes('secure'),
    httpOnly: lowerAttributes.includes('httponly'),
    sameSite,
  };
}

function evaluateCookieFlags(
  cookie: ParsedCookie,
  evidence: string,
  location: string,
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const sameSite = cookie.sameSite?.toLowerCase();

  if (!cookie.secure) {
    findings.push({
      id: `cookie-missing-secure:${cookie.name}:${location}`,
      category: 'insecure-cookie',
      severity: 'high',
      title: `Cookie "${cookie.name}" missing Secure`,
      description: 'Without Secure, the browser will also send this cookie over plain HTTP.',
      location,
      evidence,
    });
  }

  if (!cookie.httpOnly) {
    findings.push({
      id: `cookie-missing-httponly:${cookie.name}:${location}`,
      category: 'insecure-cookie',
      severity: 'medium',
      title: `Cookie "${cookie.name}" missing HttpOnly`,
      description:
        'Without HttpOnly, client-side script (and any injected XSS payload) can read this cookie.',
      location,
      evidence,
    });
  }

  if (!sameSite) {
    findings.push({
      id: `cookie-missing-samesite:${cookie.name}:${location}`,
      category: 'insecure-cookie',
      severity: 'medium',
      title: `Cookie "${cookie.name}" missing SameSite`,
      description:
        'Without SameSite, this cookie is replayed on cross-site requests (CSRF exposure).',
      location,
      evidence,
    });
  } else if (sameSite === 'none' && !cookie.secure) {
    findings.push({
      id: `cookie-samesite-none-insecure:${cookie.name}:${location}`,
      category: 'insecure-cookie',
      severity: 'critical',
      title: `Cookie "${cookie.name}" is SameSite=None without Secure`,
      description:
        'Browsers reject SameSite=None cookies without Secure, but an app relying on this will silently lose the cookie — or leak it if the browser still accepts it.',
      location,
      evidence,
    });
  }

  return findings;
}

/** Audits every cookie set by a raw `Set-Cookie` header value against baseline flags. */
export function checkCookies(setCookieHeader: string, location: string): AuditFinding[] {
  const lines = setCookieHeader
    .split(/\n|,(?=\s*[^;,]+=)/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.flatMap((line) => evaluateCookieFlags(parseSetCookie(line), line, location));
}

/** Audits cookies already parsed by the browser (`browserContext.cookies()`). */
export function checkBrowserCookies(
  cookies: readonly BrowserCookie[],
  location: string,
): AuditFinding[] {
  return cookies.flatMap((cookie) =>
    evaluateCookieFlags(
      cookie,
      `${cookie.name}: secure=${cookie.secure} httpOnly=${cookie.httpOnly} sameSite=${cookie.sameSite ?? '(none)'}`,
      location,
    ),
  );
}
