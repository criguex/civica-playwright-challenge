/**
 * Single source of truth for the mock catalogue.
 *
 * The mock HTML pages are *rendered from* these records, so tests, fixtures and
 * expected values never drift from what the mock server serves. Enrich a movie
 * here and every page/template/test picks it up automatically.
 */
export interface MovieRecord {
  /** IMDb title id, e.g. "tt1375666". */
  readonly id: string;
  readonly title: string;
  /** Release year as shown on the details page, e.g. "2010". */
  readonly year: string;
  /** Aggregate rating as shown on the details page, e.g. "8.8". */
  readonly rating: string;
  /** Content certificate, e.g. "PG-13". */
  readonly certificate: string;
  /** Human-readable runtime, e.g. "2h 28m". */
  readonly runtime: string;
  /** One or more genres, e.g. ["Action", "Sci-Fi"]. */
  readonly genres: readonly string[];
}

/** Canonical IMDb-style path for a title. */
export const titlePath = (movie: MovieRecord): string => `/title/${movie.id}/`;

export const inception: MovieRecord = {
  id: 'tt1375666',
  title: 'Inception',
  year: '2010',
  rating: '8.8',
  certificate: 'PG-13',
  runtime: '2h 28m',
  genres: ['Action', 'Sci-Fi', 'Thriller'],
};

export const shawshankRedemption: MovieRecord = {
  id: 'tt0111161',
  title: 'The Shawshank Redemption',
  year: '1994',
  rating: '9.3',
  certificate: 'R',
  runtime: '2h 22m',
  genres: ['Drama'],
};

export const theGodfather: MovieRecord = {
  id: 'tt0068646',
  title: 'The Godfather',
  year: '1972',
  rating: '9.2',
  certificate: 'R',
  runtime: '2h 55m',
  genres: ['Crime', 'Drama'],
};

export const theDarkKnight: MovieRecord = {
  id: 'tt0468569',
  title: 'The Dark Knight',
  year: '2008',
  rating: '9.0',
  certificate: 'PG-13',
  runtime: '2h 32m',
  genres: ['Action', 'Crime', 'Drama'],
};

export const theReturnOfTheKing: MovieRecord = {
  id: 'tt0167260',
  title: 'The Lord of the Rings: The Return of the King',
  year: '2003',
  rating: '9.0',
  certificate: 'PG-13',
  runtime: '3h 21m',
  genres: ['Action', 'Adventure', 'Drama'],
};

export const pulpFiction: MovieRecord = {
  id: 'tt0110912',
  title: 'Pulp Fiction',
  year: '1994',
  rating: '8.9',
  certificate: 'R',
  runtime: '2h 34m',
  genres: ['Crime', 'Drama'],
};

/** Movies discoverable through the search flow. */
export const searchableMovies: readonly MovieRecord[] = [
  inception,
  shawshankRedemption,
  theGodfather,
  theDarkKnight,
  theReturnOfTheKing,
  pulpFiction,
];

/** Chart order for the Top 250 mock (first item is the #1 movie). */
export const top250Order: readonly MovieRecord[] = [
  shawshankRedemption,
  theGodfather,
  theDarkKnight,
  theReturnOfTheKing,
  pulpFiction,
  inception,
];

/** Fast lookup by IMDb id, used by the mock router. */
export const moviesById: ReadonlyMap<string, MovieRecord> = new Map(
  searchableMovies.map((movie) => [movie.id, movie]),
);

/** A query guaranteed to return zero results, for negative testing. */
export const NO_RESULTS_QUERY = 'zxqvbmovietitlethatdoesnotexist';
