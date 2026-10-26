# ADR 0006 — Security audit POCs as a fourth, offline project

**Status:** Accepted

## Context

The framework needed to demonstrate a plausible future service — "app
audit" — without depending on a live, untrusted target, an APK, or any
external tooling in CI. The existing `mock`/`mutation` projects already prove
the pattern: deterministic fixtures driving real Page Objects/scanners, with
a learning loop measuring coverage over time.

## Decision

Add a fourth project, `audit`, under `tests/audit/`, built from three
independent POCs (see [AUDIT-POC.md](../AUDIT-POC.md)):

1. A web-exposure scanner over traffic captured from a fictitious mock app
   (`accountAppMock`), checking PII/secret leaks, missing security headers,
   and cookie flags.
2. A static analyzer over a decoded-manifest fixture shaped like a real
   `rea inspect-android-package`/`rea decode-android-resources` dump,
   checking dangerous permissions, exported components, cleartext traffic,
   debuggability, and hardcoded secrets.
3. A security-mutant engine, reusing the mutation-testing pattern from
   [ADR-0005](0005-mutant-scenarios.md), that injects one planted defect per
   mutant over a hardened baseline and measures the scanners' kill rate.

Each scanner/analyzer emits the same `AuditFinding`/`AuditReport` shape
(`src/audit/types.ts`), so one renderer/writer serves all three. The security
mutants write to a sibling ledger
(`ledger/audit-mutation-insights.json`) via a sibling reporter, instead
of touching the existing search-mutant ledger or its reporter.

## Consequences

- CI stays offline and fast: no APK, no JDK, no live target — `npm run
test:audit` runs exactly like `test:mock`/`test:mutation`.
- The web-exposure POC surfaced a real Playwright/Chromium limitation
  (`Set-Cookie` is hidden from `response.headers()` for a page's own traffic);
  documented in AUDIT-POC.md "Límites" rather than worked around silently.
- Feeding a real APK through `rea` is documented, not implemented, so the
  mapping from `rea`'s actual JSON to the `DecodedManifest` fixture shape is a
  known, explicit gap rather than an untested code path.
- Adding a new audit check (a new detector, a new permission, a new mutant) is
  additive — same pattern as the existing mutators in
  [`src/support/mutations.ts`](../../src/support/mutations.ts).
