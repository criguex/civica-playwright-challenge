import { SEVERITY_ORDER, type AuditReport, type Severity } from './types.js';

/**
 * Renders an {@link AuditReport} as a small, self-contained HTML page —
 * shared by all three audit POCs (web exposure, Android static analysis,
 * security mutants) so a reviewer opens one consistent report format
 * regardless of which scanner produced it.
 */
const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#b00020',
  high: '#d9534f',
  medium: '#e0a800',
  low: '#5a7dbb',
  info: '#6c757d',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSummary(report: AuditReport): string {
  return SEVERITY_ORDER.map((severity) => {
    const count = report.summary[severity];
    return `<span class="badge" style="background:${SEVERITY_COLOR[severity]}">${severity}: ${count}</span>`;
  }).join('\n');
}

function renderRows(report: AuditReport): string {
  if (report.findings.length === 0) {
    return '<tr><td colspan="6">No findings — nothing to report.</td></tr>';
  }

  return [...report.findings]
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
    .map(
      (finding) => `<tr>
        <td><span class="badge" style="background:${SEVERITY_COLOR[finding.severity]}">${finding.severity}</span></td>
        <td>${escapeHtml(finding.category)}</td>
        <td>${escapeHtml(finding.title)}</td>
        <td>${escapeHtml(finding.location)}</td>
        <td>${escapeHtml(finding.evidence)}</td>
        <td>${escapeHtml(finding.description)}</td>
      </tr>`,
    )
    .join('\n');
}

export function renderAuditReportHtml(report: AuditReport): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Audit report — ${escapeHtml(report.subject)}</title>
    <style>
      body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
             margin: 24px; color: #1a1a1a; }
      h1 { margin-bottom: 0; }
      .meta { color: #6c757d; margin-top: 4px; }
      .badge { display: inline-block; color: #fff; border-radius: 6px; padding: 2px 10px;
                font-size: 0.85rem; font-weight: 600; }
      table { border-collapse: collapse; width: 100%; margin-top: 20px; }
      th, td { border-bottom: 1px solid #ddd; padding: 8px 10px; text-align: left;
                vertical-align: top; font-size: 0.9rem; }
      th { background: #f5f5f5; }
      tr:hover { background: #fafafa; }
    </style>
  </head>
  <body>
    <h1>Audit report</h1>
    <p class="meta">${escapeHtml(report.subject)} · generated ${escapeHtml(report.generatedAt)}</p>
    <p>${renderSummary(report)}</p>
    <table>
      <thead>
        <tr><th>Severity</th><th>Category</th><th>Title</th><th>Location</th><th>Evidence</th><th>Description</th></tr>
      </thead>
      <tbody>${renderRows(report)}</tbody>
    </table>
  </body>
</html>`;
}
