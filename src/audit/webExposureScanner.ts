import { buildAuditReport, type AuditFinding, type AuditReport, type Severity } from './types.js';
import { findExposedPii, type ExposureKind } from './exposureDetectors.js';
import { findSecrets } from './secretPatterns.js';
import { checkSecurityHeaders } from './securityHeaders.js';
import { checkCookies } from './cookieAudit.js';

/**
 * A single request/response pair captured off a mock flow (see
 * docs/AUDIT-POC.md) — deliberately shaped like what `page.on('response')` or
 * a HAR entry hands over, so swapping the capture source never touches the
 * scanner itself.
 */
export interface CapturedExchange {
  readonly url: string;
  readonly method: string;
  readonly status: number;
  readonly responseHeaders: Readonly<Record<string, string>>;
  readonly responseBody: string;
}

const PII_SEVERITY: Record<ExposureKind, Severity> = {
  email: 'low',
  phone: 'low',
  documentId: 'medium',
  cardNumber: 'critical',
};

const PII_TITLE: Record<ExposureKind, string> = {
  email: 'Email address exposed in response body',
  phone: 'Phone number exposed in response body',
  documentId: 'National document id exposed in response body',
  cardNumber: 'Unmasked card number exposed in response body',
};

/** Redacts all but the first/last couple of characters, for safe evidence snippets. */
function redact(value: string): string {
  const visible = value.replace(/[ -]/g, '').length <= 6 ? 1 : 2;
  return `${value.slice(0, visible)}${'•'.repeat(Math.max(value.length - visible * 2, 3))}${value.slice(-visible)}`;
}

function scanBodyForExposedData(body: string, location: string): AuditFinding[] {
  const piiFindings = findExposedPii(body).map((match, index): AuditFinding => ({
    id: `pii-exposure:${match.kind}:${location}:${index}`,
    category: 'pii-exposure',
    severity: PII_SEVERITY[match.kind],
    title: PII_TITLE[match.kind],
    description: `A ${match.kind} was found unmasked in the response body.`,
    location,
    evidence: redact(match.value),
  }));

  const secretFindings = findSecrets(body).map((match, index): AuditFinding => ({
    id: `secret-exposure:${match.kind}:${location}:${index}`,
    category: 'secret-exposure',
    severity: 'critical',
    title: `${match.label} exposed in response body`,
    description: `A ${match.label} was found in the response body instead of being issued/stored out of band.`,
    location,
    evidence: redact(match.value),
  }));

  return [...piiFindings, ...secretFindings];
}

/** Runs every check (headers, cookies, body) over one captured exchange. */
export function scanExchange(exchange: CapturedExchange): AuditFinding[] {
  const location = `${exchange.method} ${exchange.url}`;
  const setCookie =
    exchange.responseHeaders['set-cookie'] ?? exchange.responseHeaders['Set-Cookie'];

  return [
    ...checkSecurityHeaders(exchange.responseHeaders, location),
    ...(setCookie ? checkCookies(setCookie, location) : []),
    ...scanBodyForExposedData(exchange.responseBody, location),
  ];
}

/** Scans a whole captured flow and summarizes it into an {@link AuditReport}. */
export function scanExchanges(
  subject: string,
  exchanges: readonly CapturedExchange[],
): AuditReport {
  return buildAuditReport(subject, exchanges.flatMap(scanExchange));
}
