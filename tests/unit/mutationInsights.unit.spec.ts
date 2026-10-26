import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import {
  HISTORY_WINDOW,
  prioritize,
  readLedger,
  recordRun,
  writeLedger,
  type InsightsLedger,
  type MutantStatus,
} from '../../src/support/mutationInsights.js';

const mutants = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

function runs(...statuses: MutantStatus[]): InsightsLedger {
  return statuses.reduce<InsightsLedger>(
    (ledger, status) => recordRun(ledger, [['a', { status, durationMs: 1 }]]),
    {},
  );
}

test.describe('mutation ledger @unit', () => {
  test('orders failed first, then never seen, then the rest, stable within a weight', () => {
    const ledger = recordRun({}, [
      ['a', { status: 'passed', durationMs: 1 }],
      ['c', { status: 'failed', durationMs: 1 }],
      ['d', { status: 'timedOut', durationMs: 1 }],
    ]);
    expect(prioritize(mutants, ledger).map((m) => m.id)).toEqual(['c', 'b', 'a', 'd']);
    expect(prioritize(mutants, {}).map((m) => m.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  test('counts every run but forgets failures older than the window', () => {
    const ledger = runs('failed', ...Array<MutantStatus>(HISTORY_WINDOW - 1).fill('passed'));
    expect(ledger.a).toMatchObject({ runs: HISTORY_WINDOW, failures: 1 });

    const forgotten = recordRun(ledger, [['a', { status: 'passed', durationMs: 1 }]]);
    expect(forgotten.a).toMatchObject({ runs: HISTORY_WINDOW + 1, failures: 0 });
    expect(forgotten.a.history).toHaveLength(HISTORY_WINDOW);
    expect(prioritize(mutants, forgotten)[0].id).not.toBe('a');
  });

  test('keeps timeouts apart from failures and does not promote them', () => {
    const ledger = runs('timedOut', 'interrupted');
    expect(ledger.a).toMatchObject({ runs: 2, failures: 0, timeouts: 1 });
    expect(prioritize([{ id: 'b' }, { id: 'a' }], ledger).map((m) => m.id)).toEqual(['b', 'a']);
  });

  test('migrates a legacy entry without history', () => {
    const legacy = {
      a: { id: 'a', status: 'failed', durationMs: 1, runs: 7, failures: 7 },
    } as unknown as InsightsLedger;
    const ledger = recordRun(legacy, [['a', { status: 'passed', durationMs: 1 }]]);
    expect(ledger.a).toMatchObject({ runs: 8, failures: 1, history: ['failed', 'passed'] });
  });

  test('reads the legacy path when the new one does not exist yet', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ledger-'));
    const legacy = join(dir, 'old.json');
    writeFileSync(legacy, JSON.stringify(runs('failed')));
    const loaded = readLedger(join(dir, 'new.json'), legacy);
    expect(loaded.source).toBe(legacy);
    expect(loaded.warning).toBeUndefined();
    expect(loaded.ledger.a.failures).toBe(1);
  });

  test('a corrupt file warns, yields no learned order, and is backed up before rewrite', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ledger-'));
    const path = join(dir, 'ledger.json');

    for (const garbage of ['{ not json', '[]', 'null']) {
      writeFileSync(path, garbage);
      const loaded = readLedger(path);
      expect(loaded.ledger).toEqual({});
      expect(loaded.warning).toContain('running without learned order');
      expect(prioritize(mutants, loaded.ledger).map((m) => m.id)).toEqual(['a', 'b', 'c', 'd']);

      writeLedger(path, runs('passed'), loaded);
      expect(readFileSync(`${path}.corrupt`, 'utf8')).toBe(garbage);
      expect(readLedger(path).ledger.a.runs).toBe(1);
    }
  });

  test('a missing file is a fresh start, not a warning', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ledger-'));
    const loaded = readLedger(join(dir, 'missing.json'));
    expect(loaded).toEqual({ ledger: {} });
    writeLedger(join(dir, 'sub', 'ledger.json'), {}, loaded);
    expect(existsSync(join(dir, 'sub', 'ledger.json.corrupt'))).toBe(false);
  });
});
