import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { INSIGHTS_PATH } from '../src/support/mutationPaths.js';
import type { InsightsLedger, MutantOutcome } from '../src/support/mutationInsights.js';

/**
 * Persists the outcome of every `@mutant` test into the insights ledger, so the
 * next run can learn from it (see src/support/mutationInsights.ts). Cumulative
 * counters (`runs`, `failures`) survive across runs; the mutation engine reads
 * them to prioritize known-weak scenarios first.
 */
export default class MutationInsightsReporter implements Reporter {
  private readonly current = new Map<
    string,
    { status: TestResult['status']; durationMs: number }
  >();

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!test.title.includes('@mutant')) {
      return;
    }
    const id = test.title.split(' ')[0];
    this.current.set(id, { status: result.status, durationMs: result.duration });
  }

  onEnd(_result: FullResult): void {
    if (this.current.size === 0) {
      return;
    }

    const ledger: InsightsLedger = existsSync(INSIGHTS_PATH)
      ? (JSON.parse(readFileSync(INSIGHTS_PATH, 'utf8')) as InsightsLedger)
      : {};

    for (const [id, outcome] of this.current) {
      const previous = ledger[id];
      const failed = outcome.status !== 'passed' && outcome.status !== 'skipped';
      const merged: MutantOutcome = {
        id,
        status: outcome.status,
        durationMs: outcome.durationMs,
        runs: (previous?.runs ?? 0) + 1,
        failures: (previous?.failures ?? 0) + (failed ? 1 : 0),
      };
      ledger[id] = merged;
    }

    mkdirSync(dirname(INSIGHTS_PATH), { recursive: true });
    writeFileSync(INSIGHTS_PATH, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
  }
}
