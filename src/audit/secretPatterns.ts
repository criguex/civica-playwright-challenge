/**
 * Token/secret shapes shared by the web exposure scanner and the Android
 * static analyzer (`webExposureScanner.ts`, `androidStaticAnalyzer.ts`), so a
 * JWT or an API key is recognized the same way whether it leaked in an HTTP
 * response or in a decoded string resource.
 *
 * All example values used across fixtures are fabricated and namespaced as
 * `FAKE`/`example.com` — see docs/AUDIT-POC.md.
 */
export type SecretKind = 'jwt' | 'apiKey';

export interface SecretPattern {
  readonly kind: SecretKind;
  readonly label: string;
  readonly pattern: RegExp;
}

export const SECRET_PATTERNS: readonly SecretPattern[] = [
  {
    kind: 'jwt',
    label: 'JWT',
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  },
  {
    kind: 'apiKey',
    label: 'API key / access token',
    pattern: /\b(?:sk_live|sk_test|AKIA|ghp_|xox[baprs]-)[A-Za-z0-9_-]{8,}\b/g,
  },
];

/** Runs every secret pattern against `text`, returning each distinct match. */
export function findSecrets(
  text: string,
): Array<{ kind: SecretKind; label: string; value: string }> {
  const matches: Array<{ kind: SecretKind; label: string; value: string }> = [];
  for (const { kind, label, pattern } of SECRET_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      matches.push({ kind, label, value: match[0] });
    }
  }
  return matches;
}
