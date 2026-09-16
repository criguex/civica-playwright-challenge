/**
 * Tiny, dependency-free logger.
 *
 * Page objects and fixtures log through this single seam instead of calling
 * `console.*` directly, so the output format (or sink) can be swapped in one
 * place. Steps show up in Playwright's stdout and help when triaging CI runs.
 */
export const logger = {
  step(message: string): void {
    console.log(`→ ${message}`);
  },
  info(message: string): void {
    console.log(`ℹ ${message}`);
  },
  warn(message: string): void {
    console.warn(`⚠ ${message}`);
  },
};
