import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { INSIGHTS_PATH, LEGACY_INSIGHTS_PATH } from '../src/support/mutationPaths.js';
import {
  readLedger,
  recordRun,
  writeLedger,
  type MutantStatus,
} from '../src/support/mutationInsights.js';

/**
 * Persists the outcome of every test tagged `tag` into its ledger (see
 * src/support/mutationInsights.ts), so the next run can learn from it. The
 * ledger lives in `ledger/`, outside Playwright's output folder, so it
 * survives between runs; CI carries it over as an artifact.
 */
export default class MutationInsightsReporter implements Reporter {
  private readonly current = new Map<string, { status: MutantStatus; durationMs: number }>();

  protected readonly tag: string = '@mutant';
  protected readonly path: string = INSIGHTS_PATH;
  protected readonly legacyPath: string = LEGACY_INSIGHTS_PATH;

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!test.title.includes(this.tag)) {
      return;
    }
    const id = test.title.split(' ')[0];
    this.current.set(id, { status: result.status, durationMs: result.duration });
  }

  onEnd(): void {
    if (this.current.size === 0) {
      return;
    }
    const loaded = readLedger(this.path, this.legacyPath);
    if (loaded.warning) {
      console.warn(`⚠ ${loaded.warning}; the old file is kept as ${this.path}.corrupt`);
    }
    writeLedger(this.path, recordRun(loaded.ledger, this.current), loaded);
  }
}
