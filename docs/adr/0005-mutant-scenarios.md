# ADR 0005 — Learning mutant scenarios

**Status:** Accepted

## Context

Hand-writing every input variation is tedious and always incomplete. We want
coverage that expands automatically and focuses effort where it pays off, based
on what previous executions revealed.

## Decision

Generate mutant scenarios from golden flows (`src/support/mutations.ts`) in three
classes (equivalent / boundary / negative), each self-checking its expected
outcome. A reporter records outcomes into a ledger
(`test-results/mutation-insights.json`); the engine reads it to prioritize
previously-failing and never-seen mutants first (`prioritize()`), keeping the run
deterministic via stable sorting.

## Consequences

- One golden flow yields many self-validating scenarios.
- The suite gets smarter each run without manual test authoring.
- Requires the mock's search semantics to stay stable (mutators are written to
  respect them). Full rationale and roadmap in
  [MUTATION-TESTING.md](../MUTATION-TESTING.md).
