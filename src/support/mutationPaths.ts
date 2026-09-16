/**
 * Shared location of the mutation "insights" ledger — the memory of previous
 * runs that the engine learns from. Kept under `test-results/` (a build
 * artifact, git-ignored) and written by the mutation-insights reporter.
 */
export const INSIGHTS_PATH = 'test-results/mutation-insights.json';
