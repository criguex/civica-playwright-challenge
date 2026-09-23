import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { ask, noul, score } from './jev.js';
import type { JevState } from './jev.js';
import { logger } from '../utils/logger.js';

/**
 * Semantic assertions backed by Jev.
 *
 * A locator assertion answers "is this exact string on screen?". A semantic
 * assertion answers "does this screen communicate X to the user?" — which is
 * the question the acceptance criteria actually asked. The first breaks when
 * marketing rewrites a label; the second survives copy changes, translations
 * and redesigns, and only fails when the *meaning* regresses.
 *
 * Because Jev returns a bare probability with no rationale, every assertion
 * attaches the exact state it judged plus the full probability distribution to
 * the Playwright report. A verdict nobody can audit is not evidence.
 *
 * Without an API key these helpers record the evidence and annotate the test,
 * but deliberately do not assert: the offline stub is lexical, and asserting on
 * it would manufacture a green that means nothing. Same principle as the e2e
 * project skipping honestly behind the anti-bot wall.
 */

const DEFAULT_THRESHOLD = 0.8;

/* Stated rather than derived from the threshold: `1 - 0.8` is 0.19999999999999996
 * in binary floating point, and that lands verbatim in the attached evidence. */
const DEFAULT_CEILING = 0.2;

async function attach(name: string, body: unknown): Promise<void> {
  const info = test.info();
  await info.attach(name, {
    body: JSON.stringify(body, null, 2),
    contentType: 'application/json',
  });
}

function annotateSkip(claim: string): void {
  test.info().annotations.push({
    type: 'jev-not-evaluated',
    description: `No TYPESAFE_API_KEY — not judged: "${claim}"`,
  });
  logger.warn(`jev skipped (offline) · ${claim}`);
}

function visibleText(page: Page): Promise<string> {
  return page.locator('body').innerText();
}

export interface SemanticOptions {
  /** Minimum probability required to pass. Raise it for release gates. */
  threshold?: number;
  /** Judge this instead of the page's visible text. */
  state?: JevState;
}

/**
 * Asserts that the page communicates `claim` to the user.
 *
 * @example
 * await expectSemantic(page, 'The page tells the user no results were found');
 */
export async function expectSemantic(
  page: Page,
  claim: string,
  options: SemanticOptions = {},
): Promise<number> {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const state = options.state ?? (await visibleText(page));

  const result = await ask(state, { holds: noul(claim) });
  const answer = result.answers.holds;
  const probability = answer.type === 'noul' ? answer.probability : 0;

  await attach(`jev · ${claim}`, {
    claim,
    threshold,
    probability,
    verdict: probability >= threshold ? 'pass' : 'fail',
    model: result.model,
    offline: result.offline,
    state,
  });

  if (result.offline) {
    annotateSkip(claim);
    return probability;
  }

  logger.info(`jev ${probability.toFixed(2)} ≥ ${threshold} · ${claim}`);

  expect(
    probability,
    `Jev scored ${probability.toFixed(2)} (needed ≥ ${threshold}) for: "${claim}"`,
  ).toBeGreaterThanOrEqual(threshold);

  return probability;
}

/**
 * Asserts the opposite: the page must *not* communicate `claim`.
 *
 * Useful for negative coverage where an absence is the requirement — no error
 * banner on a happy path, no stale data after a refresh.
 */
export async function expectNotSemantic(
  page: Page,
  claim: string,
  options: SemanticOptions = {},
): Promise<number> {
  const ceiling = options.threshold ?? DEFAULT_CEILING;
  const state = options.state ?? (await visibleText(page));

  const result = await ask(state, { holds: noul(claim) });
  const answer = result.answers.holds;
  const probability = answer.type === 'noul' ? answer.probability : 1;

  await attach(`jev · NOT ${claim}`, {
    claim,
    ceiling,
    probability,
    verdict: probability <= ceiling ? 'pass' : 'fail',
    model: result.model,
    offline: result.offline,
    state,
  });

  if (result.offline) {
    annotateSkip(`NOT ${claim}`);
    return probability;
  }

  expect(
    probability,
    `Jev scored ${probability.toFixed(2)} (needed ≤ ${ceiling}) for: "${claim}"`,
  ).toBeLessThanOrEqual(ceiling);

  return probability;
}

/**
 * Scores observed behaviour against a user story's acceptance criteria.
 *
 * This is the machine-readable half of certification: instead of a human
 * eyeballing whether the evidence satisfies the AC, Jev places it on an ordered
 * rubric and returns where it landed plus how concentrated the distribution
 * was. Low confidence is the signal to escalate to a human, not to guess.
 */
export async function scoreAgainstCriteria(
  page: Page,
  acceptanceCriteria: string,
  options: { minimum?: number; state?: JevState } = {},
): Promise<number> {
  const minimum = options.minimum ?? 2.5;
  const evidence = options.state ?? (await visibleText(page));

  const result = await ask(
    { acceptanceCriteria, evidence },
    {
      fulfilment: score(
        'How completely does the observed behaviour satisfy the acceptance criteria?',
        [
          'Does not satisfy the criteria at all',
          'Partially satisfies them, with material gaps',
          'Satisfies them, with minor cosmetic deviations',
          'Fully satisfies every stated criterion',
        ],
      ),
    },
  );

  const answer = result.answers.fulfilment;
  const value = answer.type === 'score' ? answer.score : 0;
  const confidence = answer.type === 'score' ? answer.confidence : 0;

  await attach('jev · acceptance criteria', {
    acceptanceCriteria,
    minimum,
    score: value,
    confidence,
    distribution: answer.type === 'score' ? answer.probabilities : {},
    model: result.model,
    offline: result.offline,
    evidence,
  });

  if (result.offline) {
    annotateSkip('acceptance criteria fulfilment');
    return value;
  }

  expect(
    value,
    `Jev scored ${value.toFixed(2)}/3 against the acceptance criteria (needed ≥ ${minimum})`,
  ).toBeGreaterThanOrEqual(minimum);

  return value;
}
