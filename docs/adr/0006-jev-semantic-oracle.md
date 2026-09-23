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
- **Two transports, one model.** Jev is reachable directly
  (`TYPESAFE_API_KEY`) or through Vercel AI Gateway (`AI_GATEWAY_API_KEY`),
  which exposes a TypeSafe-compatible endpoint at the same price. TypeSafe
  paused its own signups on 2026-09-22 after demand outran capacity; the
  gateway route kept the work unblocked. A single-vendor dependency on a
  two-week-old company is a risk worth designing around.
- **No key means no assertion.** Without either key the helpers record
  the evidence, annotate the test and return *without asserting*. The offline
  stub is lexical; asserting on it would manufacture a green that means
  nothing. This mirrors how the `e2e` project skips honestly behind the
  anti-bot wall (see ADR 0002) rather than faking a pass.

## Consequences

- Tests survive rewording, i18n and redesigns; they fail when meaning
  regresses, which is what the acceptance criteria actually asked for.
- Triage drops from reading every stacktrace to reviewing the handful Jev
  flagged as real defects. Measured against seeded failures whose titles gave
  nothing away (`scenario alpha`…`delta`, so only the error and stack were
  available to judge):

  | Seeded fault | Classified | Confidence | Runner-up |
  | --- | --- | --- | --- |
  | Unresolvable host | infra | 0.99 | — |
  | Rating asserted as 9.9, actual 8.8 | bug | 0.85 | data 0.10 |
  | `data-testid` absent from the DOM | selector | 0.72 | timing 0.19 |

  Three for three, and the confidence spread is the useful part: a DNS failure
  is unambiguous, a failed equality could plausibly be stale fixtures, and a
  locator timeout genuinely could be either rot or a race. `retryWouldPass`
  stayed at 0.15-0.31 throughout, correctly — none of these recover on retry.
  Gate on confidence around 0.75: route the decisive ones automatically and
  put the rest in front of a human.

  Not covered: the `timing` class was never observed, because the probe meant
  to trigger it passed instead. A genuine race is the hardest of the five to
  seed deterministically and remains untested.
- The repo stays clonable and green without an account or a key.
- **Jev is a hosted black box.** No weights, no self-hosting, and state leaves
  the machine. Do not point it at regulated or customer data without approval;
  prefer sending stacktraces over page content where both would answer.
- **Vendor benchmarks are vendor benchmarks.** The published speed and cost
  multiples come from TypeSafe's own evals. Measure against our data before
  trusting a threshold.
- Thresholds are a new tuning surface. First run against the live model
  (`jev-latest` via Vercel AI Gateway) on the mock catalogue:

  | Claim | Probability |
  | --- | --- |
  | Page reports no matching titles (true) | 0.99 |
  | Page presents Inception with rating and year (true) | 0.98 |
  | Page shows an error (false) | 0.02 |
  | Page presents The Matrix, 1999 (false) | 0.01 |
  | Acceptance criteria fulfilment | 2.83 / 3, confidence 0.83 |

  The oracle discriminates cleanly, but note what this does *not* establish:
  every case landed at a pole, so nothing exercised the boundary. Any
  threshold between roughly 0.1 and 0.9 would have produced identical
  verdicts. `0.8` is therefore still unvalidated — it is only known not to be
  wrong on unambiguous inputs. Calibrate it against genuinely marginal states
  (partial renders, half-translated copy, a rating present but stale) before
  trusting it to gate a release.
