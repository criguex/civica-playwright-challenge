import {
  moviesById,
  searchableMovies,
  titlePath,
  top250Order,
  type MovieRecord,
} from '../data/movies.js';

/**
 * Renders tiny, self-contained IMDb-like pages from the mock catalogue.
 *
 * Every element the Page Objects query for — the "Search IMDb" box, the
 * "Open Navigation Menu" button, the `hero__pageTitle` / rating test-ids and
 * the ranked chart links — is reproduced here with the *same* semantics IMDb
 * exposes, so the exact same Page Objects drive both the mock and the live
 * site. Presentation is intentionally minimal; only structure/semantics matter.
 */

/** Shared page chrome: navigation menu + global search. */
function header(): string {
  return `
    <header>
      <button aria-label="Open Navigation Menu"
              onclick="document.getElementById('nav-drawer').hidden = false">☰ Menu</button>
      <nav id="nav-drawer" hidden aria-label="Main navigation">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/chart/top/">Top 250 Movies</a></li>
        </ul>
      </nav>
      <form action="/find/" method="get" role="search">
        <input type="text" name="q" placeholder="Search IMDb" aria-label="Search IMDb" />
        <button type="submit">Search</button>
      </form>
    </header>`;
}

/** Minimal IMDb-flavoured styling so the mock reads as a real, if tiny, site. */
const STYLES = `
  :root { color-scheme: light; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         margin: 0; background: #1a1a1a; color: #111; }
  header { display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
           background: #121212; padding: 12px 20px; }
  header button { background: #f5c518; color: #111; border: 0; border-radius: 6px;
                  padding: 8px 12px; font-weight: 700; cursor: pointer; }
  header form { display: flex; gap: 8px; margin-left: auto; }
  header input { padding: 8px 12px; border: 0; border-radius: 6px; min-width: 240px; }
  header form button { background: #f5c518; }
  nav ul { display: flex; gap: 16px; list-style: none; margin: 0; padding: 0; }
  nav a { color: #f5c518; text-decoration: none; }
  main { max-width: 860px; margin: 24px auto; background: #fff; border-radius: 12px;
         padding: 28px 32px; box-shadow: 0 8px 30px rgba(0,0,0,.35); }
  h1 { margin: .1em 0 .4em; }
  a { color: #0a66c2; text-decoration: none; }
  a:hover { text-decoration: underline; }
  ul { line-height: 1.9; }
  [data-testid="hero-rating-bar__aggregate-rating__score"] { font-size: 1.6rem; font-weight: 700; }
`;

/** Wraps body content in a valid HTML document. */
function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>${STYLES}</style>
  </head>
  <body>
    ${header()}
    <main>${body}</main>
  </body>
</html>`;
}

export function homePage(): string {
  return layout(
    'IMDb — Movies, TV and Celebrities',
    `<h1>Welcome to IMDb</h1>
     <p>Search millions of movies, or browse the Top 250.</p>`,
  );
}

export function findPage(query: string): string {
  const q = query.trim();
  const matches = searchableMovies.filter((movie) =>
    movie.title.toLowerCase().includes(q.toLowerCase()),
  );

  const items =
    matches.length > 0
      ? matches
          .map((movie) => `<li><a href="${titlePath(movie)}">${movie.title}</a></li>`)
          .join('\n')
      : '<li>No results found.</li>';

  return layout(
    `Find - ${q} - IMDb`,
    `<h1>Results for "${q}"</h1>
     <section data-testid="find-results-section-title">
       <h3>Titles</h3>
       <ul>${items}</ul>
     </section>`,
  );
}

export function moviePage(movie: MovieRecord): string {
  return layout(
    `${movie.title} (${movie.year}) - IMDb`,
    `<article>
       <h1 data-testid="hero__pageTitle"><span>${movie.title}</span></h1>
       <ul>
         <li><a href="/title/${movie.id}/releaseinfo/">${movie.year}</a></li>
         <li>PG-13</li>
       </ul>
       <div>
         <span data-testid="hero-rating-bar__aggregate-rating__score">${movie.rating}</span>
         <span>/10</span>
       </div>
     </article>`,
  );
}

export function chartPage(): string {
  const rows = top250Order
    .map(
      (movie, index) => `<li><a href="${titlePath(movie)}">${index + 1}. ${movie.title}</a></li>`,
    )
    .join('\n');

  return layout(
    'IMDb Top 250 Movies',
    `<h1>IMDb Top 250 Movies</h1>
     <ul>${rows}</ul>`,
  );
}

export function notFoundPage(path: string): string {
  return layout('404 - IMDb', `<h1>Page not found</h1><p><code>${path}</code></p>`);
}

/** Looks up a movie by the id embedded in a `/title/ttXXXXXXX/…` path. */
export function movieByTitlePath(pathname: string): MovieRecord | undefined {
  const match = pathname.match(/^\/title\/(tt\w+)/);
  return match ? moviesById.get(match[1]) : undefined;
}
