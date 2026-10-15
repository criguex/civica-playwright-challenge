import { z } from 'zod';

/**
 * Contracts for the fictitious movie-catalogue API
 * (mocks/server/apiMockServer.ts). Contract tests validate every response
 * against these schemas, never the other way around — a schema only changes
 * when the API contract changes on purpose, not to make a test pass against
 * whatever the service happens to return.
 */
export const movieSchema = z.object({
  id: z.string().regex(/^tt\d+$/),
  title: z.string().min(1),
  year: z.string().regex(/^\d{4}$/),
  rating: z.string().regex(/^\d(\.\d)?$/),
  certificate: z.string().min(1),
  runtime: z.string().min(1),
  genres: z.array(z.string().min(1)).min(1),
  url: z.string().regex(/^\/title\/tt\d+\/$/),
});

export const movieListSchema = z.array(movieSchema);

export const rankedMovieSchema = movieSchema.extend({
  rank: z.number().int().positive(),
});

export const top250ResponseSchema = z.array(rankedMovieSchema);

export const searchResponseSchema = z.object({
  query: z.string(),
  results: movieListSchema,
});

export const errorResponseSchema = z.object({
  error: z.string().min(1),
});
