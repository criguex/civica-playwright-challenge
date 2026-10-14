import { test, expect } from '../../src/fixtures/apiFixtures.js';
import { NO_RESULTS_QUERY, searchableMovies, top250Order } from '../../mocks/data/movies.js';

/**
 * API tests for the fictitious movie-catalogue backend
 * (mocks/server/apiMockServer.ts) — status codes, response shape and content
 * negotiation, driven through Playwright's `request` fixture against a real
 * loopback socket (no browser, no `page.route`).
 */
test.describe('Movie catalogue API @api', () => {
  test('GET /api/movies lists the whole catalogue', async ({ apiContext }) => {
    const response = await apiContext.get('/api/movies');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toHaveLength(searchableMovies.length);
    expect(body.map((movie: { title: string }) => movie.title)).toEqual(
      searchableMovies.map((movie) => movie.title),
    );
  });

  for (const movie of searchableMovies) {
    test(`GET /api/movies/${movie.id} returns "${movie.title}"`, async ({ apiContext }) => {
      const response = await apiContext.get(`/api/movies/${movie.id}`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.title).toBe(movie.title);
      expect(body.year).toBe(movie.year);
      expect(body.rating).toBe(movie.rating);
      expect(body.url).toBe(`/title/${movie.id}/`);
    });
  }

  test('GET /api/movies/:id 404s with an error envelope for an unknown id', async ({
    apiContext,
  }) => {
    const response = await apiContext.get('/api/movies/tt0000000');

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toContain('tt0000000');
  });

  test('GET /api/search finds a title case-insensitively', async ({ apiContext }) => {
    const response = await apiContext.get('/api/search', { params: { q: 'iNcEpTiOn' } });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].title).toBe('Inception');
  });

  test('GET /api/search returns an empty array, not an error, for no matches', async ({
    apiContext,
  }) => {
    const response = await apiContext.get('/api/search', { params: { q: NO_RESULTS_QUERY } });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.results).toEqual([]);
  });

  test('GET /api/top250 returns the chart in rank order', async ({ apiContext }) => {
    const response = await apiContext.get('/api/top250');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(top250Order.length);

    body.forEach((entry: { rank: number; title: string }, index: number) => {
      expect(entry.rank).toBe(index + 1);
      expect(entry.title).toBe(top250Order[index].title);
    });
  });
});
