import {
  AUDIT_INSIGHTS_PATH,
  LEGACY_AUDIT_INSIGHTS_PATH,
} from '../src/audit/auditMutationPaths.js';
import MutationInsightsReporter from './mutationInsightsReporter.js';

/**
 * Sibling of `mutationInsightsReporter.ts` for `@auditMutant` tests (the
 * security-mutant kill-rate loop, docs/AUDIT-POC.md POC 3). Same ledger shape —
 * a mutant "passes" exactly when the auditor detects its planted defect — in
 * its own file so the two learning loops stay independent. Equivalent mutants
 * are tagged `@auditEquivalent` and never enter this ledger.
 */
export default class AuditMutationInsightsReporter extends MutationInsightsReporter {
  protected readonly tag = '@auditMutant';
  protected readonly path = AUDIT_INSIGHTS_PATH;
  protected readonly legacyPath = LEGACY_AUDIT_INSIGHTS_PATH;
}
