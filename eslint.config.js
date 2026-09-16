import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

/**
 * Flat ESLint config: JS + TypeScript recommended rules, plus Playwright-aware
 * linting for the test files. Keeps the codebase consistent as it grows.
 */
export default tseslint.config(
  {
    ignores: ['node_modules', 'playwright-report', 'test-results', 'blob-report'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['tests/**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
  },
  {
    files: ['tests/**/*.spec.ts'],
    rules: {
      // Conditional skips (behind the anti-bot wall) are intentional and honest.
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
    },
  },
);
