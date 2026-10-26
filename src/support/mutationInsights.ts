import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { INSIGHTS_PATH, LEGACY_INSIGHTS_PATH } from './mutationPaths.js';

/**
 * The learning loop: read the outcomes of previous mutant runs and use them to
 * prioritize the current run (docs/MUTATION-TESTING.md).
 *
 * What it remembers, per mutant:
 *   - `runs`     — every run ever recorded (never forgets).
 *   - `history`  — the statuses of the last {@link HISTORY_WINDOW} runs.
 *   - `failures` — `failed` results inside that window (older ones are forgotten).
 *   - `timeouts` — `timedOut` results inside that window, kept apart from
 *                  `failures` because a timeout says more about the machine
 *                  than about the mutant; they do not move a mutant up.
 */
export type MutantStatus = 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';

export const HISTORY_WINDOW = 5;

export interface MutantOutcome {
  readonly id: string;
  readonly status: MutantStatus;
  readonly durationMs: number;
  readonly runs: number;
  readonly failures: number;
  readonly timeouts: number;
  readonly history: readonly MutantStatus[];
}

export type InsightsLedger = Record<string, MutantOutcome>;

export interface LoadedLedger {
  readonly ledger: InsightsLedger;
  /** File the ledger was read from (the legacy path when only that one exists). */
  readonly source?: string;
  /** Set when a file exists but cannot be used; the run goes on without learned order. */
  readonly warning?: string;
}

/**
 * Reads a ledger, fail-open: a missing file is a fresh start, and a corrupt one
 * is reported through `warning` instead of being swallowed.
 */
export function readLedger(path: string, legacyPath?: string): LoadedLedger {
  const source = [path, legacyPath].find((candidate) => !!candidate && existsSync(candidate));
  if (!source) {
    return { ledger: {} };
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(source, 'utf8'));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('top level is not a JSON object');
    }
    return { ledger: parsed as InsightsLedger, source };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      ledger: {},
      source,
      warning: `mutation ledger ${source} is unreadable (${reason}); running without learned order`,
    };
  }
}

/** Loads the search-mutant ledger (falls back to the pre-`ledger/` location). */
export function loadInsights(): LoadedLedger {
  return readLedger(INSIGHTS_PATH, LEGACY_INSIGHTS_PATH);
}

/** Folds one run's results into the ledger, applying the forgetting window. */
export function recordRun(
  ledger: InsightsLedger,
  results: Iterable<readonly [string, { status: MutantStatus; durationMs: number }]>,
): InsightsLedger {
  const next: InsightsLedger = { ...ledger };
  for (const [id, result] of results) {
    const previous = ledger[id];
    const previousHistory = previous?.history ?? (previous ? [previous.status] : []);
    const history = [...previousHistory, result.status].slice(-HISTORY_WINDOW);
    next[id] = {
      id,
      status: result.status,
      durationMs: result.durationMs,
      runs: (previous?.runs ?? 0) + 1,
      failures: history.filter((status) => status === 'failed').length,
      timeouts: history.filter((status) => status === 'timedOut').length,
      history,
    };
  }
  return next;
}

/** Writes the ledger; a corrupt previous file is kept as `<path>.corrupt` first. */
export function writeLedger(path: string, ledger: InsightsLedger, loaded: LoadedLedger): void {
  mkdirSync(dirname(path), { recursive: true });
  if (loaded.warning && loaded.source) {
    copyFileSync(loaded.source, `${path}.corrupt`);
  }
  writeFileSync(path, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
}

/**
 * Reorders mutants so the highest-signal ones run first:
 *   1. failed within the window → run first (fastest feedback on known-weak spots)
 *   2. never seen before        → run next (new coverage)
 *   3. everything else          → run last (timeouts alone do not promote)
 *
 * Sorting is stable, so equal-weight mutants keep their declared order — the
 * whole run stays deterministic regardless of the ledger's contents.
 */
export function prioritize<T extends { id: string }>(mutants: T[], insights: InsightsLedger): T[] {
  const weightOf = (mutant: T): number => {
    const outcome = insights[mutant.id];
    if (!outcome) {
      return 1;
    }
    if (outcome.failures > 0) {
      return 0;
    }
    return 2;
  };

  return [...mutants]
    .map((mutant, index) => ({ mutant, index }))
    .sort((a, b) => weightOf(a.mutant) - weightOf(b.mutant) || a.index - b.index)
    .map((entry) => entry.mutant);
}
