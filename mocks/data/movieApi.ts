import {
  moviesById,
  searchableMovies,
  titlePath,
  top250Order,
  type MovieRecord,
} from './movies.js';

/**
 * Public JSON shape served by the fictitious movie-catalogue API
 * (mocks/server/apiMockServer.ts). Derived from the same `movies.ts` single
 * source of truth as the HTML mock, so UI, API and contract tests can never
 * drift from each other.
 */
export interface ApiMovie {
  readonly id: string;
  readonly title: string;
  readonly year: string;
  readonly rating: string;
  readonly certificate: string;
  readonly runtime: string;
  readonly genres: readonly string[];
  readonly url: string;
}

export interface RankedApiMovie extends ApiMovie {
  readonly rank: number;
}

export interface SearchApiResponse {
  readonly query: string;
  readonly results: readonly ApiMovie[];
}

export interface ApiErrorResponse {
  readonly error: string;
}

function toApiMovie(movie: MovieRecord): ApiMovie {
  return { ...movie, url: titlePath(movie) };
}

export function listMovies(): readonly ApiMovie[] {
  return searchableMovies.map(toApiMovie);
}

export function findMovieById(id: string): ApiMovie | undefined {
  const movie = moviesById.get(id);
  return movie ? toApiMovie(movie) : undefined;
}

export function searchMoviesByTitle(query: string): SearchApiResponse {
  const normalized = query.trim();
  const needle = normalized.toLowerCase();
  const results = searchableMovies
    .filter((movie) => movie.title.toLowerCase().includes(needle))
    .map(toApiMovie);
  return { query: normalized, results };
}

export function listTop250(): readonly RankedApiMovie[] {
  return top250Order.map((movie, index) => ({ ...toApiMovie(movie), rank: index + 1 }));
}

export function notFoundError(id: string): ApiErrorResponse {
  return { error: `movie "${id}" not found` };
}
