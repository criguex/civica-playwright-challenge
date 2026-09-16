import { test as pageTest } from '../../src/fixtures/pageFixtures.js';
import { installImdbMock } from '../../mocks/server/imdbMockRouter.js';

/**
 * Extends the Page Object fixtures with an auto-installed IMDb mock.
 *
 * The `mockedSite` fixture is `auto`, so every test in the mock project runs
 * against the offline replica without repeating setup. The live `e2e` project
 * simply imports the base fixtures instead — same tests, different backend.
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

export { expect } from '../../src/fixtures/pageFixtures.js';
