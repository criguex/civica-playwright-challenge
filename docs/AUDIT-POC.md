# 🔍 Audit POCs — a security-audit service, previewed on this framework

> Three self-contained proofs of concept for a **future service: "app
> audit"** — scan what an app exposes over the wire, scan what an Android
> package declares, and measure the auditor itself with mutants. All three
> run 100% offline against mocks/fixtures, the same philosophy as the rest of
> this repo (see [Why a mock layer?](../README.md#-why-a-mock-layer)).

This is a demonstration, not a product: the point is to show the _shape_ of
the audit — what it checks, how it reports, how its own effectiveness gets
measured — on data nobody needs to trust a live target for. Section
["Scaling to a real app"](#-scaling-to-a-real-app) below is the bridge from
here to an actual engagement.

---

## 📑 Contents

- [POC 1 — Web exposure audit](#poc-1--web-exposure-audit)
- [POC 2 — Mobile (Android) static audit](#poc-2--mobile-android-static-audit)
- [POC 3 — Mutants that measure the auditor](#poc-3--mutants-that-measure-the-auditor)
- [Architecture](#-architecture)
- [Run everything](#-run-everything)
- [Scaling to a real app](#-scaling-to-a-real-app)
- [Límites (honest gaps)](#-límites-honest-gaps)

---

## POC 1 — Web exposure audit

**Demonstrates:** capturing a flow's HTTP traffic and scanning it for PII/secret
leaks, missing baseline security headers, and cookies missing `Secure` /
`HttpOnly` / `SameSite`.

**Fixture:** a fictitious "account dashboard"
([`mocks/data/accountApp.ts`](../mocks/data/accountApp.ts),
[`mocks/server/accountAppMock.ts`](../mocks/server/accountAppMock.ts)) with two
API responses modelling the two ends of the same bug:

| Endpoint                   | Body                                                   | Headers                 | Cookie                       |
| -------------------------- | ------------------------------------------------------ | ----------------------- | ---------------------------- |
| `GET /dashboard`           | HTML shell, triggers both fetches below                | ❌ none of the baseline | ❌ `session_id`, no flags    |
| `GET /api/account/profile` | raw card number, email, phone, doc id, debug token/JWT | ❌ none of the baseline | —                            |
| `GET /api/account/safe`    | masked card, no PII                                    | ✅ CSP/HSTS/nosniff     | ✅ `safe_session`, all flags |

**Scanner:** [`src/audit/webExposureScanner.ts`](../src/audit/webExposureScanner.ts)
wires together three independent checks, each unit-sized on its own:

- [`exposureDetectors.ts`](../src/audit/exposureDetectors.ts) — emails, phone
  numbers, document ids (fictitious `DOC-########` shape) and card numbers
  (any 13–19 digit run that also passes [`isValidLuhn()`](../src/audit/luhn.ts),
  so a phone number or order id is never mistaken for a card).
- [`secretPatterns.ts`](../src/audit/secretPatterns.ts) — JWTs and common API-key
  shapes (`sk_live`/`sk_test`/`AKIA`/`ghp_`/`xox…`), shared with the Android
  analyzer so a token is recognized the same way wherever it leaks.
- [`securityHeaders.ts`](../src/audit/securityHeaders.ts) — missing
  Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options,
  and clickjacking protection (`frame-ancestors` in the CSP, or
  `X-Frame-Options`).
- [`cookieAudit.ts`](../src/audit/cookieAudit.ts) — missing `Secure` /
  `HttpOnly` / `SameSite`, plus `SameSite=None` without `Secure`.

**Capture:** [`tests/audit/webExposure.audit.spec.ts`](../tests/audit/webExposure.audit.spec.ts)
navigates to `/dashboard` and listens with `page.on('response')` — the same
capture point a real app audit would use against a live target, or the
equivalent of replaying a HAR file. Cookies are read from
`browserContext.cookies()` instead of the `Set-Cookie` header; see
[Límites](#-límites-honest-gaps) for why.

**Run it:**

```bash
npm run test:audit -- webExposure
cat test-results/audit/web-exposure.json     # machine-readable
open test-results/audit/web-exposure.html    # human-readable, severity-coloured
```

**What it found** (this fixture, this run): **16 findings** on the vulnerable
flow (3 critical, 3 high, 8 medium, 2 low) — an unmasked card number, a JWT and
an API key in the `profile` body, every baseline header missing on `/dashboard`
and `/profile`, and the insecure cookie's missing `Secure`/`HttpOnly`. **Zero**
findings on `/api/account/safe` and on the `safe_session` cookie — the
no-false-positives control.

---

## POC 2 — Mobile (Android) static audit

**Demonstrates:** flagging dangerous permissions, exported components,
cleartext traffic, debuggable builds, and hardcoded secrets from a _decoded_
manifest + string-resource dump — no APK execution, no emulator.

**Fixture:** [`mocks/data/androidApp.ts`](../mocks/data/androidApp.ts) — a
fictitious `com.example.ficticia.walletdemo` package in two versions:
`sampleVulnerableManifest`/`sampleVulnerableStrings` (one planted issue per
check) and `sampleHardenedManifest`/`sampleHardenedStrings` (the same app,
fixed — the no-false-positives control, and the baseline POC 3 mutates).

**Analyzer:** [`src/audit/androidStaticAnalyzer.ts`](../src/audit/androidStaticAnalyzer.ts):

| Check                      | Flags                                                                  | Severity                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `flagDangerousPermissions` | `READ_SMS`, `CAMERA`, `SYSTEM_ALERT_WINDOW`, …                         | high/medium, per permission                                                                                                                               |
| `flagExportedComponents`   | any exported component without an intent filter                        | critical (provider) → high (service) → medium (activity/receiver); `info` for an exported activity _with_ an intent filter (the expected deep-link shape) |
| `flagCleartextTraffic`     | `android:usesCleartextTraffic="true"`                                  | high                                                                                                                                                      |
| `flagDebuggableBuild`      | `android:debuggable="true"`                                            | high                                                                                                                                                      |
| `flagHardcodedSecrets`     | JWTs/API keys in decoded string resources (reuses `secretPatterns.ts`) | critical                                                                                                                                                  |

**Run it:**

```bash
npm run test:audit -- androidStaticAudit
cat test-results/audit/android-static.json
open test-results/audit/android-static.html
```

**What it found:** **14 findings** on the vulnerable package (4 critical, 5
high, 4 medium, 1 info) — 5 dangerous permissions, 3 unsafely-exported
components (plus one expected `info`-level export), cleartext traffic,
debuggable build, and 3 hardcoded secrets. The hardened baseline reports
**zero blocking findings** (only the expected `info` on the one legitimate
exported/deep-link activity).

### Feeding it a real APK with `rea`

This repo ships only the fixture above — wiring a real APK is a documented
recipe, **not** something CI depends on (keeps CI offline and fast):

```bash
rea inspect-android-package /path/to/app.apk \
  --format json > app.manifest.json

rea decode-android-resources /path/to/app.apk \
  --format json > app.resources.json
```

1. From `app.manifest.json`, build a `DecodedManifest`
   ([`mocks/data/androidApp.ts`](../mocks/data/androidApp.ts)): package name,
   `android:debuggable`, `android:usesCleartextTraffic`, the `<uses-permission>`
   list, and every `<activity>`/`<service>`/`<receiver>`/`<provider>` with its
   `exported` flag and whether it declares an `<intent-filter>`.
2. From `app.resources.json`, pull the decoded string-resource values into a
   flat `string[]` (one entry per resource) — the shape
   `flagHardcodedSecrets()` scans.
3. Call `auditAndroidPackage(manifest, strings)` exactly as the test does.

`rea`'s exact output field names are its own (run `--schema` / `--llms` for the
live shape); step 1–2 is a small adapter, not a rewrite of the analyzer. This
repo keeps that adapter undone on purpose — see [Límites](#-límites-honest-gaps).

---

## POC 3 — Mutants that measure the auditor

**Demonstrates:** reusing the mutation-testing engine (see
[MUTATION-TESTING.md](MUTATION-TESTING.md)) to answer the question a checklist
can't: _does the auditor actually catch its own blind spots?_

**Mutants** ([`src/audit/securityMutations.ts`](../src/audit/securityMutations.ts)):
start from a hardened baseline — the `safe` web response/cookie, the hardened
Android manifest — and inject exactly **one** planted defect per mutant:

| Mutant kind            | Defect injected                                                |
| ---------------------- | -------------------------------------------------------------- |
| `pii-leak`             | raw card number added to an otherwise-clean body               |
| `missing-header` (×3)  | CSP / HSTS / X-Content-Type-Options stripped                   |
| `insecure-cookie`      | `Secure`/`HttpOnly`/`SameSite` stripped from a hardened cookie |
| `dangerous-permission` | `READ_SMS` added to the hardened manifest                      |

Each mutant's `detect()` runs the **real** scanner/analyzer and reports
whether it caught its own defect. A mutant "survives" (test fails) exactly
when the control has a blind spot — the same self-checking contract as
`src/support/mutations.ts`'s search mutants, aimed at the auditor instead of
the IMDb mock.

**Learning loop:** outcomes are written to
[`test-results/audit-mutation-insights.json`](../reporters/auditMutationInsightsReporter.ts) —
a sibling of the search-mutant ledger
([`test-results/mutation-insights.json`](../src/support/mutationPaths.ts)), kept
separate so the two learning loops never collide.

**Run it:**

```bash
npm run test:audit -- securityMutants
cat test-results/audit-mutation-insights.json     # cumulative ledger (runs/failures per mutant)
cat test-results/audit/security-mutants.json      # this run's kill-rate report
```

**Kill rate (this run): 6/6 — 100%.** Every planted defect was caught. A
mutant that ever survives is a genuine, actionable finding about the audit
service itself (not the mocks it's measured against), and is exactly the kind
of regression this loop exists to catch before it reaches a real engagement.

---

## 🏗️ Architecture

```mermaid
flowchart TD
  subgraph POC1["POC 1 — Web exposure"]
    A1["accountAppMock<br/>(vulnerable + safe)"] -->|page.on('response')| A2["CapturedExchange[]"]
    A2 --> A3["webExposureScanner"]
    A3 --> A4["exposureDetectors · secretPatterns<br/>securityHeaders · cookieAudit"]
  end

  subgraph POC2["POC 2 — Android static audit"]
    B1["androidApp fixture<br/>(vulnerable + hardened)"] --> B2["androidStaticAnalyzer"]
    B2 --> A4
  end

  subgraph POC3["POC 3 — Security mutants"]
    C1["hardened baselines"] --> C2["securityMutations<br/>(inject 1 defect)"]
    C2 -->|detect()| A3
    C2 -->|detect()| B2
    C3["auditMutationInsightsReporter"] --> C4["audit-mutation-insights.json"]
  end

  A3 --> R["buildAuditReport"]
  B2 --> R
  R --> W["auditReportWriter<br/>JSON + HTML"]
```

---

## 🚀 Run everything

```bash
npm run test:audit                      # all three POCs
cat test-results/audit/*.json           # every report this run produced
cat test-results/audit-mutation-insights.json
```

CI runs this project the same way it runs `mock`/`mutation` — deterministic,
offline, fast — and uploads `test-results/audit/` plus the ledger as a build
artifact (see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).

---

## 📈 Scaling to a real app

- **Web:** swap `page.on('response')` for a HAR recording
  (`context.tracing`/`page.routeFromHAR` reversed, or a proxy like mitmproxy)
  against the real target; feed its entries into `CapturedExchange[]` —
  `scanExchange()`/`scanExchanges()` don't care where the data came from.
- **Mobile:** the [`rea`](#feeding-it-a-real-apk-with-rea) recipe above; the
  analyzer only needs the decoded shape, never the APK itself.
- **More checks:** each detector/analyzer function is independent and
  additive (same `AuditFinding` shape) — adding a check never touches the
  others, same `Open/closed` principle the rest of this repo follows.
- **More mutants:** `generateSecurityMutants()` is a flat list; a new defect
  class is one more function plus one more entry.

---

## ⚠️ Límites (honest gaps)

- **Set-Cookie is invisible to `response.headers()` for a page's own traffic**
  in Chromium automation — mocked or live, by design (the same restriction
  Fetch's spec puts on script). POC 1 reads cookies from
  `browserContext.cookies()` instead; `checkCookies()` (raw-header parsing)
  stays available for a HAR/proxy capture, which _does_ see the header.
- **Chromium defaults an unset `SameSite` to `Lax`.** Reading cookies from the
  browser's jar can't tell "the response explicitly set `SameSite=Lax`" apart
  from "the response never mentioned it" — only a HAR/proxy capture sees the
  literal header and can flag the omission itself.
- **The Android fixture is hand-built**, not run through `rea` in this repo
  (by design, so CI never needs an APK or a JDK). The mapping from `rea`'s real
  output to `DecodedManifest`/`strings[]` is documented, not implemented —
  field names in `rea`'s actual JSON may differ from this fixture's and need a
  small adapter.
- **Static only.** Nothing here executes code, launches a browser against a
  real target, or installs an APK. It answers "what does this app declare/
  expose", not "what does it do at runtime" (dynamic analysis, fuzzing, and
  runtime instrumentation are future-service scope, not this POC's).
- **Regex-based secret/PII detection** will miss novel shapes and can
  false-positive on look-alikes; it is a first pass, not a replacement for a
  real secret-scanning engine (e.g. entropy-based detectors) in production use.

---

See also: [MUTATION-TESTING.md](MUTATION-TESTING.md) ·
[docs/adr/0006-audit-pocs.md](adr/0006-audit-pocs.md) · [GROWTH.md](GROWTH.md)
