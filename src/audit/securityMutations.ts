import {
  INSECURE_COOKIE,
  SECURE_COOKIE,
  SECURE_RESPONSE_HEADERS,
  fictitiousCustomer,
  renderSafeResponse,
} from '../../mocks/data/accountApp.js';
import { sampleHardenedManifest, type DecodedManifest } from '../../mocks/data/androidApp.js';
import { flagDangerousPermissions } from './androidStaticAnalyzer.js';
import { checkCookies } from './cookieAudit.js';
import { checkSecurityHeaders } from './securityHeaders.js';
import { scanExchange, type CapturedExchange } from './webExposureScanner.js';

/**
 * Security mutants for the auditor itself (docs/AUDIT-POC.md, POC 3): take a
 * known-hardened baseline (the `safe` web response, the hardened Android
 * manifest) and inject exactly one planted defect per mutant. Each mutant's
 * `detect()` runs the real scanner/analyzer and reports whether it caught its
 * own defect — the "kill rate" is the fraction of mutants where it does.
 *
 * This mirrors `src/support/mutations.ts`: a mutant is a self-checking
 * scenario with a declared expected outcome, not a smoke run.
 */
export type SecurityMutantKind =
  'pii-leak' | 'missing-header' | 'insecure-cookie' | 'dangerous-permission';

export interface SecurityMutant {
  readonly id: string;
  readonly kind: SecurityMutantKind;
  readonly description: string;
  readonly detect: () => boolean;
}

const BASELINE_EXCHANGE: CapturedExchange = {
  url: 'https://account.example.com/api/account/safe',
  method: 'GET',
  status: 200,
  responseHeaders: { ...SECURE_RESPONSE_HEADERS, 'set-cookie': SECURE_COOKIE },
  responseBody: renderSafeResponse(),
};

function piiLeakMutant(): SecurityMutant {
  const mutated: CapturedExchange = {
    ...BASELINE_EXCHANGE,
    responseBody: JSON.stringify({
      ...JSON.parse(BASELINE_EXCHANGE.responseBody),
      cardNumber: fictitiousCustomer.cardNumber,
    }),
  };

  return {
    id: 'security-mutant--pii-leak-card-number',
    kind: 'pii-leak',
    description: 'Inject an unmasked card number into an otherwise-clean response body.',
    detect: () =>
      scanExchange(mutated).some(
        (finding) => finding.category === 'pii-exposure' && finding.severity === 'critical',
      ),
  };
}

function withoutHeader(
  headers: Readonly<Record<string, string>>,
  header: string,
): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).filter(([key]) => key !== header));
}

function missingHeaderMutant(header: string): SecurityMutant {
  const mutatedHeaders = withoutHeader(BASELINE_EXCHANGE.responseHeaders, header);

  return {
    id: `security-mutant--missing-header-${header}`,
    kind: 'missing-header',
    description: `Strip the ${header} response header from an otherwise-hardened response.`,
    detect: () =>
      checkSecurityHeaders(mutatedHeaders, BASELINE_EXCHANGE.url).some((finding) =>
        finding.id.includes(header),
      ),
  };
}

function insecureCookieMutant(): SecurityMutant {
  return {
    id: 'security-mutant--insecure-cookie-flags',
    kind: 'insecure-cookie',
    description: 'Strip Secure/HttpOnly/SameSite from an otherwise-hardened cookie.',
    detect: () =>
      checkCookies(INSECURE_COOKIE, BASELINE_EXCHANGE.url).some(
        (finding) => finding.category === 'insecure-cookie',
      ),
  };
}

function dangerousPermissionMutant(): SecurityMutant {
  const mutatedManifest: DecodedManifest = {
    ...sampleHardenedManifest,
    permissions: [...sampleHardenedManifest.permissions, 'android.permission.READ_SMS'],
  };

  return {
    id: 'security-mutant--dangerous-permission-read-sms',
    kind: 'dangerous-permission',
    description: 'Add a dangerous permission (READ_SMS) to an otherwise-hardened manifest.',
    detect: () =>
      flagDangerousPermissions(mutatedManifest).some(
        (finding) => finding.evidence === 'android.permission.READ_SMS',
      ),
  };
}

/** The full set of security mutants the audit POCs are measured against. */
export function generateSecurityMutants(): SecurityMutant[] {
  return [
    piiLeakMutant(),
    missingHeaderMutant('content-security-policy'),
    missingHeaderMutant('strict-transport-security'),
    missingHeaderMutant('x-content-type-options'),
    insecureCookieMutant(),
    dangerousPermissionMutant(),
  ];
}
