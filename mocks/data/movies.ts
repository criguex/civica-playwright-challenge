/**
 * Single source of truth for the mock catalogue.
 *
 * The mock HTML pages are *rendered from* these records, so tests, fixtures and
 * fixtures' expected values never drift from what the mock server serves.
 */
export interface MovieRecord {
  /** IMDb title id, e.g. "tt1375666". */
  readonly id: string;
  readonly title: string;
  /** Release year as shown on the details page, e.g. "2010". */
  readonly year: string;
  /** Aggregate rating as shown on the details page, e.g. "8.8". */
  readonly rating: string;
}

/** Canonical IMDb-style path for a title. */
export const titlePath = (movie: MovieRecord): string => `/title/${movie.id}/`;

export const inception: MovieRecord = {
  id: 'tt1375666',
  title: 'Inception',
  year: '2010',
  rating: '8.8',
};

export const shawshankRedemption: MovieRecord = {
  id: 'tt0111161',
  title: 'The Shawshank Redemption',
  year: '1994',
  rating: '9.3',
};

export const theGodfather: MovieRecord = {
  id: 'tt0068646',
  title: 'The Godfather',
  year: '1972',
  rating: '9.2',
};

export const theDarkKnight: MovieRecord = {
  id: 'tt0468569',
  title: 'The Dark Knight',
  year: '2008',
  rating: '9.0',
};

/** Movies discoverable through the search flow. */
export const searchableMovies: readonly MovieRecord[] = [
  inception,
  shawshankRedemption,
  theGodfather,
  theDarkKnight,
];

/** Chart order for the Top 250 mock (first item is the #1 movie). */
export const top250Order: readonly MovieRecord[] = [
  shawshankRedemption,
  theGodfather,
  theDarkKnight,
  inception,
];

/** Fast lookup by IMDb id, used by the mock router. */
export const moviesById: ReadonlyMap<string, MovieRecord> = new Map(
  searchableMovies.map((movie) => [movie.id, movie]),
);
