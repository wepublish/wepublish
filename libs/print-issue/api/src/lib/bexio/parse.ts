import { normalizeIssue } from '../rules/issue';

/**
 * A bexio kind as the medium configures it (setting `printBexioKinds`): what
 * the lists call it, the word that marks it in bexio, and what must follow the
 * word — a period (a year or a date range) or one issue.
 */
export type BexioKind = {
  id: string;
  label: string;
  word: string;
  refersTo: 'period' | 'issue';
};

/** Both ends included, as calendar days (YYYY-MM-DD). */
export type BexioPeriod = { from: string; to: string };

const pad = (value: number) => String(value).padStart(2, '0');

/** dd.mm.yyyy → YYYY-MM-DD; null for a day that does not exist. */
const day = (d: string, m: string, y: string): string | null => {
  const [dd, mm, yyyy] = [Number(d), Number(m), Number(y)];
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));

  return (
      date.getUTCFullYear() === yyyy &&
        date.getUTCMonth() === mm - 1 &&
        date.getUTCDate() === dd
    ) ?
      `${yyyy}-${pad(mm)}-${pad(dd)}`
    : null;
};

const DATE = String.raw`(\d{1,2})\.(\d{1,2})\.(\d{4})`;
const RANGE = new RegExp(String.raw`${DATE}\s*(?:–|-|bis)\s*${DATE}`, 'i');
// a year on its own: not part of a date, not glued to other digits
const YEAR = /(?<![\d.])(\d{4})(?![\d.])/;

/**
 * The period a text names: a date range «15.03.2026–14.03.2027» (also «-» or
 * «bis») or a year «2027» for the calendar year. Null when there is none, or
 * when it is invalid (a day that does not exist, an end before the start).
 */
export function parsePeriod(
  text: string | null | undefined
): BexioPeriod | null {
  if (!text) {
    return null;
  }

  const range = RANGE.exec(text);

  if (range) {
    const from = day(range[1]!, range[2]!, range[3]!);
    const to = day(range[4]!, range[5]!, range[6]!);

    return from && to && from <= to ? { from, to } : null;
  }

  // a lone date is a start without an end: no period
  if (new RegExp(DATE).test(text)) {
    return null;
  }

  const year = YEAR.exec(text)?.[1];

  return year ? { from: `${year}-01-01`, to: `${year}-12-31` } : null;
}

export const inPeriod = (shipDay: string, { from, to }: BexioPeriod) =>
  from <= shipDay && shipDay <= to;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export type KindMatch = {
  kind: BexioKind;
  /** an «n×» prefix in the text; null when there is none */
  copies: number | null;
  /** what follows the word */
  rest: string;
};

/**
 * The kind whose word starts `text` (after an optional «n×»), as a whole word
 * and ignoring case; the longest word wins when one starts another.
 */
export function matchKind(
  text: string | null | undefined,
  kinds: BexioKind[],
  refersTo?: BexioKind['refersTo']
): KindMatch | null {
  if (!text) {
    return null;
  }

  const candidates = kinds
    .filter(
      kind => kind.word.trim() && (!refersTo || kind.refersTo === refersTo)
    )
    .sort((a, b) => b.word.length - a.word.length);

  for (const kind of candidates) {
    const match = new RegExp(
      String.raw`^\s*(?:(\d+)\s*[×x*]\s*)?${escape(kind.word.trim())}(?![\p{L}\p{N}])(.*)$`,
      'isu'
    ).exec(text);

    if (match) {
      return {
        kind,
        copies: match[1] === undefined ? null : Number(match[1]),
        rest: match[2] ?? '',
      };
    }
  }

  return null;
}

export type IssueOrder = {
  kind: BexioKind;
  copies: number | null;
  /** «6.26»; null when the line names no valid issue */
  issue: string | null;
};

/** A single-copy line: an «issue» kind's word followed by the issue label. */
export function readIssueOrder(
  text: string | null | undefined,
  kinds: BexioKind[]
): IssueOrder | null {
  const match = matchKind(text, kinds, 'issue');

  if (!match) {
    return null;
  }

  const label = /^\s*(\S+)/.exec(match.rest)?.[1] ?? '';

  return {
    kind: match.kind,
    copies: match.copies,
    issue: normalizeIssue(label),
  };
}
