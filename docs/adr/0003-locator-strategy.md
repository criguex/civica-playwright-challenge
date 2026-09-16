# ADR 0003 — Semantic locators only (no XPath/CSS)

**Status:** Accepted

## Context

XPath and CSS selectors couple tests to markup structure and styling, so they
break on refactors and fail with opaque messages.

## Decision

Address elements the way a user or assistive technology perceives them:
`getByRole`, `getByTestId`, `getByLabel`, `getByPlaceholder`, `getByText`. No
XPath, no CSS selectors anywhere in the codebase (also enforced by review).

## Consequences

- Locators survive styling/DOM refactors.
- Failures point at user-visible things.
- Encourages accessible markup (roles/labels must exist to be targeted).
