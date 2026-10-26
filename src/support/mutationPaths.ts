/**
 * Shared location of the mutation "insights" ledger — the memory of previous
 * runs that the engine learns from. It lives in `ledger/` (git-ignored), NOT
 * in `test-results/`: Playwright empties its output folder at the start of
 * every run, which used to wipe the ledger before the reporter could add to it.
 * The legacy path is still read once, so an old ledger is migrated, not lost.
 */
export const INSIGHTS_PATH = 'ledger/mutation-insights.json';
export const LEGACY_INSIGHTS_PATH = 'test-results/mutation-insights.json';
