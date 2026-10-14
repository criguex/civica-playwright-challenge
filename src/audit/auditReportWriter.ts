import { mkdirSync, writeFileSync } from 'node:fs';
import type { AuditReport } from './types.js';
import { renderAuditReportHtml } from './auditReportRenderer.js';

/**
 * Persists an {@link AuditReport} as JSON (machine-readable) + HTML
 * (human-readable) under `test-results/audit/` — a build artifact, like the
 * mutation-insights ledger, so a fresh clone stays clean and CI uploads it.
 */
const AUDIT_REPORTS_DIR = 'test-results/audit';

export function writeAuditReport(report: AuditReport, basename: string): void {
  mkdirSync(AUDIT_REPORTS_DIR, { recursive: true });
  writeFileSync(
    `${AUDIT_REPORTS_DIR}/${basename}.json`,
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(`${AUDIT_REPORTS_DIR}/${basename}.html`, renderAuditReportHtml(report), 'utf8');
}
