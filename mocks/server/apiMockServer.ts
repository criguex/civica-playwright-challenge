import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { type AddressInfo } from 'node:net';
import { logger } from '../../src/utils/logger.js';
import {
  findMovieById,
  listMovies,
  listTop250,
  notFoundError,
  searchMoviesByTitle,
} from '../data/movieApi.js';

export interface MockApiServer {
  readonly baseUrl: string;
  close(): Promise<void>;
}

/**
 * Starts a tiny, in-process HTTP server exposing the movie catalogue as
 * JSON — the fictitious backend behind the IMDb-style frontend.
 *
 * `imdbMockRouter.ts` intercepts a page's requests with `page.route`; API and
 * contract tests instead talk to a real socket through Playwright's
 * `request` fixture, so this listens on an ephemeral loopback port for the
 * lifetime of a worker instead.
 */
export function startMockApiServer(): Promise<MockApiServer> {
  return new Promise((resolve) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      respond(url, res);
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      const baseUrl = `http://127.0.0.1:${port}`;
      logger.info(`Mock API server listening at ${baseUrl}`);
      resolve({
        baseUrl,
        close: () => new Promise((res) => server.close(() => res())),
      });
    });
  });
}

function respond(url: URL, res: ServerResponse): void {
  const { pathname, searchParams } = url;

  if (pathname === '/api/movies') {
    return sendJson(res, 200, listMovies());
  }

  if (pathname === '/api/top250') {
    return sendJson(res, 200, listTop250());
  }

  if (pathname === '/api/search') {
    return sendJson(res, 200, searchMoviesByTitle(searchParams.get('q') ?? ''));
  }

  const movieIdMatch = pathname.match(/^\/api\/movies\/([^/]+)$/);
  if (movieIdMatch) {
    const id = movieIdMatch[1];
    const movie = findMovieById(id);
    return movie ? sendJson(res, 200, movie) : sendJson(res, 404, notFoundError(id));
  }

  return sendJson(res, 404, { error: `no route for ${pathname}` });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}
