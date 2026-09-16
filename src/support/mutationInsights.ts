import { existsSync, readFileSync } from 'node:fs';
import { INSIGHTS_PATH } from './mutationPaths.js';

/**
 * The learning loop: read the outcomes of previous mutant runs and use them to
 * prioritize the current run. This closes the feedback cycle described in
 * docs/MUTATION-TESTING.md — the suite gets smarter every time it runs.
 */
export interface MutantOutcome {
  readonly id: string;
  readonly status: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';
  readonly durationMs: number;
  /** Total times this mutant has ever run. */
  readonly runs: number;
  /** Total times it has ever failed. */
  readonly failures: number;
}

export type InsightsLedger = Record<string, MutantOutcome>;

/** Loads the ledger of past outcomes, or an empty ledger if none exists yet. */
export function loadInsights(): InsightsLedger {
  try {
    if (!existsSync(INSIGHTS_PATH)) {
      return {};
    }
    return JSON.parse(readFileSync(INSIGHTS_PATH, 'utf8')) as InsightsLedger;
  } catch {
    return {};
  }
}

/**
 * Reorders mutants so the highest-signal ones run first:
 *   1. previously failing → run first (fastest feedback on known-weak spots)
 *   2. never seen before  → run next (new coverage)
 *   3. consistently green → run last
 *
 * Sorting is stable, so equal-weight mutants keep their declared order — the
 * whole run stays deterministic regardless of the ledger's contents.
 */
export function prioritize<T extends { id: string }>(mutants: T[], insights: InsightsLedger): T[] {
  const weightOf = (mutant: T): number => {
    const outcome = insights[mutant.id];
    if (!outcome) {
      return 1; // never seen → new coverage, run early
    }
    if (outcome.failures > 0) {
      return 0; // known-flaky/failing → run first
    }
    return 2; // consistently passing → run last
  };

  return [...mutants]
    .map((mutant, index) => ({ mutant, index }))
    .sort((a, b) => weightOf(a.mutant) - weightOf(b.mutant) || a.index - b.index)
    .map((entry) => entry.mutant);
}
