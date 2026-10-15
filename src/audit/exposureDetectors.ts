import { isValidLuhn } from './luhn.js';

/**
 * Pure, regex-based detectors for PII that should never show up unmasked in a
 * response body. Kept separate from `webExposureScanner.ts` so each shape can
 * be unit-exercised and tuned independently (see docs/AUDIT-POC.md for the
 * fixture conventions each pattern was designed against).
 */
export type ExposureKind = 'email' | 'phone' | 'cardNumber' | 'documentId';

export interface ExposureMatch {
  readonly kind: ExposureKind;
  readonly value: string;
}

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** `+<country> <area>-<line>`, e.g. "+1 555-0147" — distinct from card-number runs. */
const PHONE_PATTERN = /\+\d{1,3}[ -]\d{2,4}-\d{4}/g;

/** Candidate card-number runs (grouped in 4s or bare), confirmed with Luhn. */
const CARD_CANDIDATE_PATTERN = /\b(?:\d[ -]?){13,19}\b/g;

/** Fictitious canonical national-document-id shape used across these fixtures. */
const DOCUMENT_ID_PATTERN = /\bDOC-\d{8}\b/g;

export function findEmails(text: string): ExposureMatch[] {
  return [...text.matchAll(EMAIL_PATTERN)].map((match) => ({ kind: 'email', value: match[0] }));
}

export function findPhoneNumbers(text: string): ExposureMatch[] {
  return [...text.matchAll(PHONE_PATTERN)].map((match) => ({ kind: 'phone', value: match[0] }));
}

export function findDocumentIds(text: string): ExposureMatch[] {
  return [...text.matchAll(DOCUMENT_ID_PATTERN)].map((match) => ({
    kind: 'documentId',
    value: match[0],
  }));
}

/** Candidate digit runs that also pass the Luhn checksum once separators are stripped. */
export function findCardNumbers(text: string): ExposureMatch[] {
  const candidates = [...text.matchAll(CARD_CANDIDATE_PATTERN)].map((match) => match[0]);
  return candidates
    .filter((candidate) => isValidLuhn(candidate.replace(/[ -]/g, '')))
    .map((value) => ({ kind: 'cardNumber', value }));
}

/** Runs every PII detector over `text`. */
export function findExposedPii(text: string): ExposureMatch[] {
  return [
    ...findEmails(text),
    ...findPhoneNumbers(text),
    ...findCardNumbers(text),
    ...findDocumentIds(text),
  ];
}
