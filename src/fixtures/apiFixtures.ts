import { request, test as base, type APIRequestContext } from '@playwright/test';
import { startMockApiServer, type MockApiServer } from '../../mocks/server/apiMockServer.js';

/**
 * API-only fixtures: a worker-scoped mock backend plus a request context
 * bound to it. Kept separate from `pageFixtures`/`mockFixtures` — API and
 * contract specs never open a browser page, just an `APIRequestContext`.
 */
interface ApiWorkerFixtures {
  apiServer: MockApiServer;
}

interface ApiTestFixtures {
  apiContext: APIRequestContext;
}

export const test = base.extend<ApiTestFixtures, ApiWorkerFixtures>({
  apiServer: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const server = await startMockApiServer();
      await use(server);
      await server.close();
    },
    { scope: 'worker' },
  ],

  apiContext: async ({ apiServer }, use) => {
    const context = await request.newContext({ baseURL: apiServer.baseUrl });
    await use(context);
    await context.dispose();
  },
});

export { expect } from '../support/customMatchers.js';
