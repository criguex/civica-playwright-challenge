# ADR 0002 — Deterministic mock as first-class backend

**Status:** Accepted

## Context

Live IMDb blocks automation behind a "Let's confirm you are human" wall. A suite
whose pass/fail depends on a third party's bot defenses is not trustworthy, and
the challenge explicitly asks for mocks when nothing is operational.

## Decision

Provide an in-process mock (`mocks/server/imdbMockRouter.ts`) that intercepts
requests and serves IMDb-shaped HTML rendered from a single data source. The
**same Page Objects** drive both the mock and the live site; only the fixture a
spec imports differs.

## Consequences

- Fast, offline, 100% deterministic default suite; safe for CI.
- Proves the Page Objects are backend-agnostic.
- The mock must mirror the real site's roles/test-ids to stay representative.
