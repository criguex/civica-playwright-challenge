import { test, expect } from '@playwright/test';
import { generateSecurityMutants } from '../../src/audit/securityMutations.js';
import { buildAuditReport, type AuditFinding } from '../../src/audit/types.js';
import { writeAuditReport } from '../../src/audit/auditReportWriter.js';
import { logger } from '../../src/utils/logger.js';

/**
 * POC 3 — mutants that measure the auditor (see docs/AUDIT-POC.md).
 *
 * Each `@auditMutant` plants exactly one security defect over a hardened
 * baseline and "passes" only if the real scanner/analyzer catches it — a
 * mutant that survives means the control has a blind spot. Outcomes feed the
 * same kind of ledger `mutationInsightsReporter.ts` keeps for search mutants
 * (see `reporters/auditMutationInsightsReporter.ts`), and the run's kill rate
 * is written as a human-readable report, same as POCs 1–2.
 */
const allMutants = generateSecurityMutants();
const mutants = allMutants.filter((mutant) => !mutant.equivalent);
const equivalents = allMutants.filter((mutant) => !!mutant.equivalent);

test.describe('Security mutants · measuring the auditor @audit', () => {
  test.afterAll(() => {
    const outcomes = mutants.map((mutant) => ({ mutant, killed: mutant.detect() }));
    const killedCount = outcomes.filter((outcome) => outcome.killed).length;
    const killRatePercent = Math.round((killedCount / outcomes.length) * 100);

    const findings: AuditFinding[] = outcomes.map(({ mutant, killed }) => ({
      id: mutant.id,
      category: 'security-mutant',
      severity: killed ? 'info' : 'critical',
      title: killed ? `Killed: ${mutant.kind}` : `SURVIVED: ${mutant.kind}`,
      description: mutant.description,
      location: mutant.kind,
      evidence: killed ? 'detected by the auditor' : 'NOT detected by the auditor',
    }));
    for (const mutant of equivalents) {
      findings.push({
        id: mutant.id,
        category: 'security-mutant',
        severity: 'info',
        title: `Equivalent: ${mutant.kind}`,
        description: mutant.description,
        location: mutant.kind,
        evidence: `equivalent, not counted in the kill rate: ${mutant.equivalent?.reason}`,
      });
    }

    const killRate = `${killedCount}/${outcomes.length} (${killRatePercent}%)`;
    const excluded = equivalents.length > 0 ? `, ${equivalents.length} equivalent excluded` : '';
    const report = buildAuditReport(
      `Security mutants — kill rate ${killRate}${excluded}`,
      findings,
    );
    writeAuditReport(report, 'security-mutants');
    logger.info(`Security mutant kill rate: ${killRate}${excluded}`);
  });

  for (const mutant of mutants) {
    test(`${mutant.id} [${mutant.kind}] @auditMutant`, async () => {
      expect(mutant.detect(), mutant.description).toBe(true);
    });
  }

  for (const mutant of equivalents) {
    test(`${mutant.id} [${mutant.kind}] equivalent @auditEquivalent`, async () => {
      expect(mutant.equivalent?.holds(), mutant.equivalent?.reason).toBe(true);
    });
  }
});
