import { type APIResponse } from '@playwright/test';
import { test, expect } from '../../src/fixtures/apiFixtures.js';
import {
  errorResponseSchema,
  movieListSchema,
  movieSchema,
  searchResponseSchema,
  top250ResponseSchema,
} from '../../src/contracts/movieApiSchemas.js';

/**
 * Contract tests for the movie-catalogue API — every response is validated
 * against the zod schemas in `src/contracts/movieApiSchemas.ts`. The schema
 * is the source of truth: a response that drifts from it is a contract
 * break to report, never a reason to loosen the schema to fit the response.
 */
async function body(response: APIResponse): Promise<unknown> {
  return response.json();
}

test.describe('Movie catalogue API · contracts @contract', () => {
  test('GET /api/movies matches the movie-list contract', async ({ apiContext }) => {
    const response = await apiContext.get('/api/movies');
    expect(await body(response)).toMatchSchema(movieListSchema);
  });

  test('GET /api/movies/:id matches the single-movie contract', async ({ apiContext }) => {
    const response = await apiContext.get('/api/movies/tt1375666');
    expect(await body(response)).toMatchSchema(movieSchema);
  });

  test('GET /api/movies/:id matches the error contract for an unknown id', async ({
    apiContext,
  }) => {
    const response = await apiContext.get('/api/movies/tt0000000');
    expect(await body(response)).toMatchSchema(errorResponseSchema);
  });

  test('GET /api/search matches the search-response contract', async ({ apiContext }) => {
    const response = await apiContext.get('/api/search', { params: { q: 'drama' } });
    expect(await body(response)).toMatchSchema(searchResponseSchema);
  });

  test('GET /api/search matches the contract even with zero results', async ({ apiContext }) => {
    const response = await apiContext.get('/api/search', { params: { q: 'no-such-movie' } });
    expect(await body(response)).toMatchSchema(searchResponseSchema);
  });

  test('GET /api/top250 matches the ranked-chart contract', async ({ apiContext }) => {
    const response = await apiContext.get('/api/top250');
    expect(await body(response)).toMatchSchema(top250ResponseSchema);
  });
});
