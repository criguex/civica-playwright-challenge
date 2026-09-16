import { type Page } from '@playwright/test';

/**
 * Detects IMDb's "Let's confirm you are human" anti-bot interstitial.
 *
 * Live E2E runs are at the mercy of a third party's bot defenses. Rather than
 * letting them fail noisily, tests call this and `test.skip(...)` with a clear
 * reason — turning an uncontrollable red into an honest, self-documenting skip.
 *
 * The wall is rendered by a JS challenge *after* `domcontentloaded`, so we race
 * the wall's heading against the real search box and decide as soon as either
 * appears — fast on a genuine page, reliable behind the wall.
 */
export async function isBotWallPresent(page: Page, timeout = 10_000): Promise<boolean> {
  const wall = page
    .getByRole('heading', { name: /confirm you are human/i })
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);

  const realPage = page
    .getByPlaceholder('Search IMDb')
    .waitFor({ state: 'visible', timeout })
    .then(() => false)
    .catch(() => false);

  return Promise.race([wall, realPage]);
}
