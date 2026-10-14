import type { AuditFinding, Severity } from './types.js';

/**
 * Baseline response-header checks a future "app audit" service would run on
 * every exchange: the headers that stop a browser from doing something unsafe
 * with the response (sniffing content-type, framing the page, downgrading to
 * plain HTTP) rather than ones that depend on business logic.
 */
interface HeaderCheck {
  readonly header: string;
  readonly category: string;
  readonly severity: Severity;
  readonly title: string;
  readonly description: string;
}

const HEADER_CHECKS: readonly HeaderCheck[] = [
  {
    header: 'content-security-policy',
    category: 'missing-security-header',
    severity: 'high',
    title: 'Missing Content-Security-Policy',
    description:
      'No CSP header: the response has no script/style/frame allow-list, widening the blast radius of any injection.',
  },
  {
    header: 'strict-transport-security',
    category: 'missing-security-header',
    severity: 'medium',
    title: 'Missing Strict-Transport-Security',
    description: 'No HSTS header: a man-in-the-middle can downgrade the connection to plain HTTP.',
  },
  {
    header: 'x-content-type-options',
    category: 'missing-security-header',
    severity: 'medium',
    title: 'Missing X-Content-Type-Options',
    description:
      'No "nosniff": the browser may MIME-sniff the body and execute it as an unintended type.',
  },
];

function headerValue(headers: Readonly<Record<string, string>>, name: string): string | undefined {
  return headers[name] ?? headers[name.toLowerCase()];
}

/** Flags any clickjacking protection missing — a `frame-ancestors` CSP directive, or legacy X-Frame-Options. */
function checkFrameAncestors(
  headers: Readonly<Record<string, string>>,
  location: string,
): AuditFinding[] {
  const csp = headerValue(headers, 'content-security-policy');
  const hasFrameAncestors = !!csp && /frame-ancestors/i.test(csp);
  const hasXFrameOptions = !!headerValue(headers, 'x-frame-options');

  if (hasFrameAncestors || hasXFrameOptions) {
    return [];
  }

  return [
    {
      id: `missing-clickjacking-protection:${location}`,
      category: 'missing-security-header',
      severity: 'medium',
      title: 'Missing clickjacking protection',
      description:
        'Neither a CSP "frame-ancestors" directive nor an X-Frame-Options header is present, so the page can be framed by a third-party site.',
      location,
      evidence: csp ? `content-security-policy: ${csp}` : '(no content-security-policy header)',
    },
  ];
}

/** Checks one exchange's response headers against the baseline and returns a finding per gap. */
export function checkSecurityHeaders(
  headers: Readonly<Record<string, string>>,
  location: string,
): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const check of HEADER_CHECKS) {
    const value = headerValue(headers, check.header);
    if (value !== undefined) {
      continue;
    }
    findings.push({
      id: `${check.category}:${check.header}:${location}`,
      category: check.category,
      severity: check.severity,
      title: check.title,
      description: check.description,
      location,
      evidence: `(no ${check.header} header)`,
    });
  }

  findings.push(...checkFrameAncestors(headers, location));

  return findings;
}
