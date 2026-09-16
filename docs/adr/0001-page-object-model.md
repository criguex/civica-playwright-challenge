# ADR 0001 — Page Object Model

**Status:** Accepted

## Context

UI tests that address elements inline become brittle and duplicated; a change to
the UI forces edits across many specs.

## Decision

Encapsulate each screen in a Page Object class (`src/pages/`) exposing
intention-revealing methods. Tests describe _what_ the user does; Page Objects
own _how_. A shared abstract `BasePage` centralizes navigation; reusable widgets
(the menu) are modelled as components and composed.

## Consequences

- One place to update when the UI changes.
- Specs read like plain English and stay short.
- Slight upfront structure; pays off immediately as flows grow.
