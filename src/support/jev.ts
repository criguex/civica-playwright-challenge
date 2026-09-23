import { logger } from '../utils/logger.js';

/**
 * Thin client for TypeSafe AI's Jev — a "System One" decision model.
 *
 * Unlike an LLM, Jev never returns prose: it returns typed answers with
 * calibrated probabilities that code can branch on. That property is what makes
 * it usable as a test oracle — there is no free-text output to parse, and
 * therefore nothing to hallucinate.
 *
 * Every question in a batch is evaluated in parallel against the same `state`,
 * so asking ten things costs roughly the same wall-clock time as asking one.
 *
 * Two transports reach the same model, so a capacity freeze on one vendor does
 * not block the suite:
 *  - `TYPESAFE_API_KEY` → api.typesafe.ai directly.
 *  - `AI_GATEWAY_API_KEY` → Vercel AI Gateway, which exposes a
 *    TypeSafe-compatible endpoint at the same price. Useful when TypeSafe has
 *    paused its own signups.
 *
 * With neither, the client falls back to a clearly-labelled lexical stub (see
 * `offlineAnswer`) so the suite stays runnable — and the repo stays clonable —
 * without an account. The stub is deliberately dumb; it exists to exercise the
 * wiring, never to certify anything.
 */

const DIRECT_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const GATEWAY_ENDPOINT = 'https://ai-gateway.vercel.sh/typesafe/v1/systemone';
const MODEL = 'jev-latest';

interface Transport {
  url: string;
  key: string;
  via: string;
}

function transport(): Transport | null {
  if (process.env.TYPESAFE_API_KEY) {
    return { url: DIRECT_ENDPOINT, key: process.env.TYPESAFE_API_KEY, via: 'typesafe' };
  }
  if (process.env.AI_GATEWAY_API_KEY) {
    return { url: GATEWAY_ENDPOINT, key: process.env.AI_GATEWAY_API_KEY, via: 'vercel-gateway' };
  }
  return null;
}

export type JevState = string | Record<string, unknown> | unknown[];

export interface NoulQuestion {
  type: 'noul';
  instructions: string;
  criteria?: { true: string; false: string };
}

export interface ChoiceQuestion {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string>;
}

export interface ScoreQuestion {
  type: 'score';
  instructions: string;
  criteria: string[];
}

export type JevQuestion = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export interface NoulAnswer {
  type: 'noul';
  probability: number;
}

export interface ChoiceAnswer {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface ScoreAnswer {
  type: 'score';
  score: number;
  probabilities: Record<string, number>;
  confidence: number;
}

export type JevAnswer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export interface JevResult<Q extends Record<string, JevQuestion>> {
  answers: { [K in keyof Q]: JevAnswer };
  offline: boolean;
  model: string;
}

export function isLive(): boolean {
  return transport() !== null;
}

let warned = false;

function warnOnce(): void {
  if (warned) {
    return;
  }
  warned = true;
  logger.warn(
    'No Jev key — answers are LEXICAL STUBS, not real decisions. Set TYPESAFE_API_KEY ' +
      '(console.typesafe.ai) or AI_GATEWAY_API_KEY (vercel.com/ai-gateway, same model and price).',
  );
}

function flatten(state: JevState): string {
  if (typeof state === 'string') {
    return state;
  }
  return JSON.stringify(state);
}

/**
 * Deterministic stand-in used when no API key is present.
 *
 * Scores questions by naive token overlap between the instructions and the
 * state. It is good enough to prove the plumbing end-to-end and to keep answer
 * shapes honest, and nowhere near good enough to gate a release on.
 */
function offlineAnswer(question: JevQuestion, state: string): JevAnswer {
  const haystack = state.toLowerCase();
  const overlap = (text: string): number => {
    const terms = text
      .toLowerCase()
      .split(/[^a-záéíóúñ0-9]+/i)
      .filter((term) => term.length > 3);
    if (terms.length === 0) {
      return 0;
    }
    const hits = terms.filter((term) => haystack.includes(term)).length;
    return hits / terms.length;
  };

  if (question.type === 'noul') {
    const score = overlap(question.instructions);
    return { type: 'noul', probability: Math.min(0.99, 0.5 + score / 2) };
  }

  if (question.type === 'choice') {
    const keys = Object.keys(question.criteria);
    const scored = keys.map((key) => ({
      key,
      weight: overlap(`${key} ${question.criteria[key]}`) + 0.01,
    }));
    const total = scored.reduce((sum, entry) => sum + entry.weight, 0);
    const probabilities = Object.fromEntries(
      scored.map((entry) => [entry.key, Number((entry.weight / total).toFixed(4))]),
    );
    const best = scored.reduce((a, b) => (a.weight >= b.weight ? a : b));
    return {
      type: 'choice',
      choice: best.key,
      probabilities,
      confidence: Number((best.weight / total).toFixed(4)),
    };
  }

  const levels = question.criteria;
  const scored = levels.map((level) => overlap(level) + 0.01);
  const total = scored.reduce((sum, weight) => sum + weight, 0);
  const probabilities = Object.fromEntries(
    scored.map((weight, index) => [String(index), Number((weight / total).toFixed(4))]),
  );
  const expected = scored.reduce((sum, weight, index) => sum + (weight / total) * index, 0);
  return {
    type: 'score',
    score: Number(expected.toFixed(2)),
    probabilities,
    confidence: Number((Math.max(...scored) / total).toFixed(4)),
  };
}

/**
 * Asks Jev a batch of typed questions about a piece of state.
 *
 * Network failures degrade to the offline stub rather than throwing: a flaky
 * decision service must never be the reason a test suite goes red.
 */
export async function ask<Q extends Record<string, JevQuestion>>(
  state: JevState,
  questions: Q,
): Promise<JevResult<Q>> {
  const flat = flatten(state);
  const route = transport();

  if (!route) {
    warnOnce();
    return {
      answers: Object.fromEntries(
        Object.entries(questions).map(([key, question]) => [key, offlineAnswer(question, flat)]),
      ) as JevResult<Q>['answers'],
      offline: true,
      model: 'offline-stub',
    };
  }

  try {
    const response = await fetch(route.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${route.key}`,
      },
      body: JSON.stringify({ model: MODEL, state, questions }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `${response.status} ${response.statusText} via ${route.via} — ${detail.slice(0, 400) || 'no body'}`,
      );
    }

    const payload = (await response.json()) as {
      model: string;
      answers: Record<string, Record<string, unknown>>;
    };

    const answers = Object.fromEntries(
      Object.entries(payload.answers).map(([key, raw]) => {
        if (raw.type === 'noul' || raw.type === 'boolean') {
          const probability = (raw.noul ?? raw.probability) as number;
          return [key, { type: 'noul', probability } satisfies NoulAnswer];
        }
        return [key, raw as unknown as JevAnswer];
      }),
    ) as JevResult<Q>['answers'];

    return { answers, offline: false, model: `${payload.model} via ${route.via}` };
  } catch (error) {
    logger.warn(`Jev unreachable (${String(error)}) — falling back to offline stub.`);
    return {
      answers: Object.fromEntries(
        Object.entries(questions).map(([key, question]) => [key, offlineAnswer(question, flat)]),
      ) as JevResult<Q>['answers'],
      offline: true,
      model: 'offline-stub',
    };
  }
}

export const noul = (instructions: string, criteria?: NoulQuestion['criteria']): NoulQuestion => ({
  type: 'noul',
  instructions,
  ...(criteria ? { criteria } : {}),
});

export const choice = (
  instructions: string,
  criteria: Record<string, string>,
): ChoiceQuestion => ({ type: 'choice', instructions, criteria });

export const score = (instructions: string, criteria: string[]): ScoreQuestion => ({
  type: 'score',
  instructions,
  criteria,
});
