/**
 * Mutant-scenario engine for the search flow.
 *
 * The idea (see docs/MUTATION-TESTING.md): take a *golden* flow — "search a
 * title, open it" — and systematically mutate its input to widen coverage
 * beyond the single happy path. Each mutator declares the class of outcome it
 * should still produce, so a mutant is a self-checking scenario:
 *
 *   - `equivalent` mutants must still find the movie (casing, whitespace…).
 *   - `boundary`   mutants probe edges that should still work (partial title).
 *   - `negative`   mutants must produce *no* results (gibberish, bad suffix).
 *
 * Mutators respect the mock's substring-search semantics so the generated
 * scenarios are deterministic and self-validating.
 */
export type MutantExpectation = 'found' | 'notFound';
export type MutantCategory = 'equivalent' | 'boundary' | 'negative';

export interface SearchMutant {
  /** Stable id, e.g. "inception--upper" — also used as the test id. */
  readonly id: string;
  readonly description: string;
  readonly category: MutantCategory;
  readonly query: string;
  readonly expectation: MutantExpectation;
}

interface QueryMutator {
  readonly suffix: string;
  readonly description: string;
  readonly category: MutantCategory;
  readonly expectation: MutantExpectation;
  readonly mutate: (title: string) => string;
}

const MUTATORS: readonly QueryMutator[] = [
  {
    suffix: 'exact',
    description: 'exact title',
    category: 'equivalent',
    expectation: 'found',
    mutate: (title) => title,
  },
  {
    suffix: 'upper',
    description: 'upper-cased',
    category: 'equivalent',
    expectation: 'found',
    mutate: (title) => title.toUpperCase(),
  },
  {
    suffix: 'lower',
    description: 'lower-cased',
    category: 'equivalent',
    expectation: 'found',
    mutate: (title) => title.toLowerCase(),
  },
  {
    suffix: 'padded',
    description: 'surrounded by whitespace',
    category: 'equivalent',
    expectation: 'found',
    mutate: (title) => `   ${title}   `,
  },
  {
    suffix: 'prefix',
    description: 'partial prefix',
    category: 'boundary',
    expectation: 'found',
    mutate: (title) => title.slice(0, Math.max(4, Math.ceil(title.length / 2))),
  },
  {
    suffix: 'garbage-suffix',
    description: 'title with an unrelated suffix',
    category: 'negative',
    expectation: 'notFound',
    mutate: (title) => `${title} qzx404`,
  },
  {
    suffix: 'gibberish',
    description: 'pure gibberish',
    category: 'negative',
    expectation: 'notFound',
    mutate: () => 'zzqxw404movie',
  },
];

/** Turns a title into a url/id-friendly slug. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Generates the full mutant scenario set for a given seed title. */
export function generateSearchMutants(title: string): SearchMutant[] {
  const slug = slugify(title);
  return MUTATORS.map((mutator) => ({
    id: `${slug}--${mutator.suffix}`,
    description: `${title} → ${mutator.description}`,
    category: mutator.category,
    query: mutator.mutate(title),
    expectation: mutator.expectation,
  }));
}
