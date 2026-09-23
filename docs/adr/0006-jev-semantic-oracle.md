# ADR 0006 — Jev as a semantic oracle

**Status:** Accepted

## Context

Two costs dominate maintenance of this suite, and neither is caused by the
application being wrong.

**Brittle oracles.** A locator assertion can only answer "is this exact string
on screen?". The acceptance criterion it stands in for asks something else:
"does this screen tell the user there are no results?". When copy is rewritten,
translated or A/B tested, the assertion fails while the product is healthy.
The test lied, and someone spends an hour proving it lied.

**Manual triage.** A red suite is a list of questions, not a list of bugs. Most
failures are environment blips, races and stale locators. Sorting them is the
first hour of the morning, it is done inconsistently, and it is the step most
likely to be skipped under pressure.

Both problems need a component that judges *meaning* and returns something the
code can branch on. A general LLM is the obvious candidate and the wrong one:
seconds of latency per assertion, a bill that scales with the suite, free-text
output to parse, and a non-zero hallucination rate in the one place a test
suite cannot tolerate one.

## Decision

Adopt **Jev** (TypeSafe AI) as a secondary oracle, alongside — never instead of
— deterministic assertions.

Jev is a *System One* model: it accepts state and typed questions, and returns
probabilities rather than prose. Three primitives cover our needs — `noul`
(yes/no → probability), `choice` (one of N → distribution) and `score` (ordered
rubric → position + distribution). It cannot hallucinate because it never
generates text, it answers in roughly 200ms, and input costs $0.042/M tokens
with output free — cheap enough to run on every assertion.

Four integration points, in the order we intend to adopt them:

1. **Failure triage** (`reporters/jevTriageReporter.ts`) — classifies every
   failure as bug / selector / timing / infra / data before anyone opens the
   report. Runs in `onEnd`, so it adds zero pipeline latency and cannot change
   a verdict.
2. **Semantic assertions** (`expectSemantic`, `expectNotSemantic`) — assert
   intent, surviving copy changes and translations.
3. **Acceptance-criteria scoring** (`scoreAgainstCriteria`) — place observed
   evidence on an ordered rubric; low confidence escalates to a human instead
   of guessing.
4. **Defect severity** — populate severity and component before a ticket is
   filed. Not yet implemented.

Two constraints are non-negotiable:

- **Every verdict attaches its evidence.** Jev returns a bare number with no
  rationale. Each helper attaches the exact state it judged plus the full
  probability distribution to the Playwright report. A verdict nobody can audit
  is not evidence, and cannot support a certification.
- **No key means no assertion.** Without `TYPESAFE_API_KEY` the helpers record
  the evidence, annotate the test and return *without asserting*. The offline
  stub is lexical; asserting on it would manufacture a green that means
  nothing. This mirrors how the `e2e` project skips honestly behind the
  anti-bot wall (see ADR 0002) rather than faking a pass.

## Consequences

- Tests survive rewording, i18n and redesigns; they fail when meaning
  regresses, which is what the acceptance criteria actually asked for.
- Triage drops from reading every stacktrace to reviewing the handful Jev
  flagged as real defects.
- The repo stays clonable and green without an account or a key.
- **Jev is a hosted black box.** No weights, no self-hosting, and state leaves
  the machine. Do not point it at regulated or customer data without approval;
  prefer sending stacktraces over page content where both would answer.
- **Vendor benchmarks are vendor benchmarks.** The published speed and cost
  multiples come from TypeSafe's own evals. Measure against our data before
  trusting a threshold.
- Thresholds are a new tuning surface. `0.8` is a starting point, not a
  finding; calibrate per assertion against known-good and known-bad states.
