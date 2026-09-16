# ADR 0004 — Multi-project topology (mock / mutation / e2e)

**Status:** Accepted

## Context

Different audiences need different guarantees: CI needs speed and determinism;
exploratory runs want the real site; coverage work wants generated scenarios.

## Decision

Expose three Playwright projects sharing config and Page Objects:

- `mock` — deterministic replica; default; includes accessibility checks.
- `mutation` — generated mutant scenarios with a learning ledger.
- `e2e` — live IMDb; opt-in; skips honestly behind the anti-bot wall.

## Consequences

- `npm test` is fast and always green (mock).
- Each concern is selected explicitly (`--project`), keeping runs focused.
- Live flakiness never blocks the build; it is quarantined to `e2e`.
