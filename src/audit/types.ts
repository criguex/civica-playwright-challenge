/**
 * Shared vocabulary for the audit POCs (see docs/AUDIT-POC.md).
 *
 * Every scanner — web exposure, Android static analysis, security mutants —
 * emits the same `AuditFinding` shape and is summarized into the same
 * `AuditReport`, so a single renderer/writer (`auditReportRenderer.ts`,
 * `auditReportWriter.ts`) serves all three.
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export const SEVERITY_ORDER: readonly Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

export interface AuditFinding {
  readonly id: string;
  readonly category: string;
  readonly severity: Severity;
  readonly title: string;
  readonly description: string;
  readonly location: string;
  readonly evidence: string;
}

export interface AuditReport {
  readonly subject: string;
  readonly generatedAt: string;
  readonly findings: readonly AuditFinding[];
  readonly summary: Readonly<Record<Severity, number>>;
}

/** Aggregates findings into a report with a per-severity summary. */
export function buildAuditReport(subject: string, findings: readonly AuditFinding[]): AuditReport {
  const summary: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const finding of findings) {
    summary[finding.severity] += 1;
  }

  return { subject, generatedAt: new Date().toISOString(), findings, summary };
}
