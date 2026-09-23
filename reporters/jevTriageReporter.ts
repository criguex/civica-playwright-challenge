import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { ask, choice, noul } from '../src/support/jev.js';
import { isLive } from '../src/support/jev.js';

/**
 * Classifies every failure before a human looks at it.
 *
 * A red suite is not a list of bugs: it is a list of *questions*. Most entries
 * are environment blips, races and stale locators, and separating them costs
 * the first hour of the morning. Jev answers that question per failure in
 * ~200ms, so the engineer opens the report already knowing which handful of
 * failures are real defects and which will pass on retry.
 *
 * Runs strictly after the suite (`onEnd`), so it never adds latency to the
 * pipeline and never influences a verdict — it only annotates one.
 */

const TRIAGE_PATH = 'test-results/jev-triage.json';

const CAUSES = {
  bug: 'A real defect in the application under test — wrong data, wrong behaviour, or a broken flow',
  selector: 'The locator no longer matches the DOM, but the application itself still works',
  timing: 'A race condition, missing wait, or element that had not settled yet',
  infra: 'Network failure, environment down, backend unavailable, or a browser crash',
  data: 'Test data was missing, stale, or had already been consumed by another run',
} as const;

type Cause = keyof typeof CAUSES;

interface Triaged {
  test: string;
  file: string;
  cause: Cause;
  confidence: number;
  retryWouldPass: number;
  distribution: Record<string, number>;
  error: string;
}

interface Failure {
  title: string;
  file: string;
  error: string;
  stack: string;
  stdout: string;
  attempts: number;
}

export default class JevTriageReporter implements Reporter {
  private readonly failures: Failure[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'passed' || result.status === 'skipped') {
      return;
    }

    this.failures.push({
      title: test.titlePath().slice(1).join(' › '),
      file: test.location.file.split('/').slice(-2).join('/'),
      error: result.error?.message?.slice(0, 2000) ?? 'unknown',
      stack: result.error?.stack?.slice(0, 2000) ?? '',
      stdout: result.stdout.join('').slice(-1500),
      attempts: result.retry + 1,
    });
  }

  async onEnd(_result: FullResult): Promise<void> {
    if (this.failures.length === 0) {
      return;
    }

    const triaged = await Promise.all(
      this.failures.map(async (failure): Promise<Triaged> => {
        const { answers } = await ask(
          {
            test: failure.title,
            error: failure.error,
            stack: failure.stack,
            logs: failure.stdout,
            attempts: failure.attempts,
          },
          {
            cause: choice('What is the root cause of this test failure?', CAUSES),
            retryWouldPass: noul('Would this test most likely pass if retried unchanged?'),
          },
        );

        const causeAnswer = answers.cause;
        const retryAnswer = answers.retryWouldPass;

        return {
          test: failure.title,
          file: failure.file,
          cause: (causeAnswer.type === 'choice' ? causeAnswer.choice : 'infra') as Cause,
          confidence: causeAnswer.type === 'choice' ? causeAnswer.confidence : 0,
          retryWouldPass: retryAnswer.type === 'noul' ? retryAnswer.probability : 0,
          distribution: causeAnswer.type === 'choice' ? causeAnswer.probabilities : {},
          error: failure.error.split('\n')[0],
        };
      }),
    );

    mkdirSync(dirname(TRIAGE_PATH), { recursive: true });
    writeFileSync(TRIAGE_PATH, `${JSON.stringify(triaged, null, 2)}\n`, 'utf8');

    this.print(triaged);
  }

  private print(triaged: Triaged[]): void {
    const byCause = new Map<Cause, Triaged[]>();
    for (const entry of triaged) {
      const bucket = byCause.get(entry.cause) ?? [];
      bucket.push(entry);
      byCause.set(entry.cause, bucket);
    }

    const realBugs = byCause.get('bug') ?? [];

    process.stdout.write(`\n  Jev triage · ${triaged.length} failure(s)\n`);
    if (!isLive()) {
      process.stdout.write('  (offline stub — set TYPESAFE_API_KEY for real classification)\n');
    }

    for (const [cause, entries] of [...byCause].sort((a, b) => b[1].length - a[1].length)) {
      process.stdout.write(`    ${cause.padEnd(9)} ${String(entries.length).padStart(3)}\n`);
    }

    if (realBugs.length > 0) {
      process.stdout.write('\n  Likely real defects:\n');
      for (const bug of realBugs) {
        process.stdout.write(`    · ${bug.test} (${bug.confidence.toFixed(2)})\n`);
      }
    }

    process.stdout.write(`\n  Full triage → ${TRIAGE_PATH}\n\n`);
  }
}
