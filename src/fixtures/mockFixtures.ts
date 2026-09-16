import { test as pageTest } from './pageFixtures.js';
import { installImdbMock } from '../../mocks/server/imdbMockRouter.js';

/**
 * Extends the Page Object fixtures with an auto-installed IMDb mock.
 *
 * The `mockedSite` fixture is `auto`, so every test that imports this `test`
 * runs against the offline replica without repeating setup. The live `e2e`
 * project imports the base fixtures instead — same Page Objects, different
 * backend. Shared here (not under tests/) so the mock, accessibility and
 * mutation suites can all reuse it.
 */
export const test = pageTest.extend<{ mockedSite: void }>({
  mockedSite: [
    async ({ page }, use) => {
      await installImdbMock(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect } from './pageFixtures.js';
