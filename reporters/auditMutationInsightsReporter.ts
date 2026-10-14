import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { AUDIT_INSIGHTS_PATH } from '../src/audit/auditMutationPaths.js';
import type { InsightsLedger, MutantOutcome } from '../src/support/mutationInsights.js';

/**
 * Sibling of `mutationInsightsReporter.ts` for `@auditMutant` tests (the
 * security-mutant kill-rate loop, docs/AUDIT-POC.md POC 3). Reuses the same
 * ledger shape — a mutant "passes" exactly when the auditor detects its
 * planted defect — but writes to its own ledger file so the two learning
 * loops stay independent.
 */
export default class AuditMutationInsightsReporter implements Reporter {
  private readonly current = new Map<
    string,
    { status: TestResult['status']; durationMs: number }
  >();

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!test.title.includes('@auditMutant')) {
      return;
    }
    const id = test.title.split(' ')[0];
    this.current.set(id, { status: result.status, durationMs: result.duration });
  }

  onEnd(_result: FullResult): void {
    if (this.current.size === 0) {
      return;
    }

    const ledger: InsightsLedger = existsSync(AUDIT_INSIGHTS_PATH)
      ? (JSON.parse(readFileSync(AUDIT_INSIGHTS_PATH, 'utf8')) as InsightsLedger)
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

    mkdirSync(dirname(AUDIT_INSIGHTS_PATH), { recursive: true });
    writeFileSync(AUDIT_INSIGHTS_PATH, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
  }
}
