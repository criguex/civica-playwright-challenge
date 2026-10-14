import { test, expect } from '@playwright/test';
import {
  sampleHardenedManifest,
  sampleHardenedStrings,
  sampleVulnerableManifest,
  sampleVulnerableStrings,
} from '../../mocks/data/androidApp.js';
import { auditAndroidPackage } from '../../src/audit/androidStaticAnalyzer.js';
import { writeAuditReport } from '../../src/audit/auditReportWriter.js';

/**
 * POC 2 — mobile audit (see docs/AUDIT-POC.md).
 *
 * Runs the static analyzer over a fixture shaped like a decoded
 * AndroidManifest + string-resource dump (what `rea inspect-android-package` /
 * `rea decode-android-resources` hand back for a real APK — see the doc for
 * the mapping). No `page` fixture, no browser, no APK execution.
 */
test.describe('Android static audit · fictitious wallet-demo package @audit', () => {
  test('flags every planted issue on the vulnerable package', async () => {
    const report = auditAndroidPackage(sampleVulnerableManifest, sampleVulnerableStrings);
    writeAuditReport(report, 'android-static');

    expect(report.findings.some((finding) => finding.category === 'dangerous-permission')).toBe(
      true,
    );
    expect(
      report.findings.filter((finding) => finding.category === 'exported-component').length,
    ).toBeGreaterThanOrEqual(3);
    expect(report.findings.some((finding) => finding.category === 'cleartext-traffic')).toBe(true);
    expect(report.findings.some((finding) => finding.category === 'debuggable-build')).toBe(true);
    expect(
      report.findings.filter((finding) => finding.category === 'hardcoded-secret').length,
    ).toBeGreaterThanOrEqual(2);
    expect(report.summary.critical).toBeGreaterThan(0);
  });

  test('reports no issues on the hardened baseline', async () => {
    const report = auditAndroidPackage(sampleHardenedManifest, sampleHardenedStrings);
    writeAuditReport(report, 'android-static-hardened');

    const blocking = report.findings.filter((finding) => finding.severity !== 'info');
    expect(blocking).toEqual([]);
  });
});
