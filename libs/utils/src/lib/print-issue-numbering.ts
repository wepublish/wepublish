/**
 * How a medium numbers its printed issues (settings `printIssueNumbering` and
 * `printIssueLabelFormat`): whether numbers restart every year or run on, and
 * the template a label is written in. Pure, so the API and the editor share it.
 */

/** `perYear`: 1–6 each year («6.26»). `continuous`: 117, 118, … («#117»). */
export type IssueCounting = 'perYear' | 'continuous';

export type IssueNumberingConfig = {
  counting: IssueCounting;
  /** e.g. «{range}.{yy}», «#{range}», «Nr. {range}/{yyyy}» */
  format: string;
};

export type IssueNumbers = {
  number: number;
  /** the last number of a double issue; null or left out for a single one */
  numberTo?: number | null;
  year: number;
};

export const PER_YEAR_LABEL_FORMAT = '{range}.{yy}';
export const CONTINUOUS_LABEL_FORMAT = '#{range}';

export const DEFAULT_ISSUE_NUMBERING: IssueNumberingConfig = {
  counting: 'perYear',
  format: PER_YEAR_LABEL_FORMAT,
};

/** What the settings offer to start from: «6.26», «#117», «Nr. 6/2026». */
export const LABEL_FORMAT_PRESETS = [
  PER_YEAR_LABEL_FORMAT,
  CONTINUOUS_LABEL_FORMAT,
  'Nr. {range}/{yyyy}',
] as const;

export const LABEL_FORMAT_MAX_LENGTH = 40;

/**
 * - `{range}`: the number, or «3/4» for a double issue
 * - `{number}`: the first number only
 * - `{yy}`, `{yyyy}`: the year
 */
const PLACEHOLDERS = ['range', 'number', 'yy', 'yyyy'] as const;

type Placeholder = (typeof PLACEHOLDERS)[number];

const TOKEN = /\{([^{}]*)\}/g;

const isPlaceholder = (name: string): name is Placeholder =>
  (PLACEHOLDERS as readonly string[]).includes(name);

const placeholdersOf = (format: string): string[] =>
  [...format.matchAll(TOKEN)].map(match => match[1] ?? '');

const isDouble = ({ number, numberTo }: IssueNumbers) =>
  !!numberTo && numberTo > number;

/** number 6 of 2026 in «{range}.{yy}» → «6.26»; 117 to 118 in «#{range}» → «#117/118» */
export function formatIssueLabel(
  issue: IssueNumbers,
  format: string = PER_YEAR_LABEL_FORMAT
): string {
  return format.replace(TOKEN, (token, name: string) => {
    switch (name) {
      case 'range':
        return isDouble(issue) ?
            `${issue.number}/${issue.numberTo}`
          : `${issue.number}`;
      case 'number':
        return `${issue.number}`;
      case 'yy':
        return String(issue.year % 100).padStart(2, '0');
      case 'yyyy':
        return `${issue.year}`;
      default:
        return token;
    }
  });
}

/** The label as it goes into a file name: «3/4.26» → «3-4.26», «#117» → «117». */
export function issueFileLabel(label: string): string {
  return label
    .replace(/[\s/]+/g, '-')
    .replace(/[^\p{L}\p{N}._-]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
}

export type LabelFormatError =
  | 'unknownPlaceholder'
  | 'noNumber'
  | 'noYear'
  | 'tooLong';

/**
 * What is wrong with a template for the counting. Numbers that restart every
 * year need the year in the label, or «6» would name every year's sixth issue.
 */
export function validateLabelFormat(
  format: string,
  counting: IssueCounting
): LabelFormatError[] {
  const names = placeholdersOf(format);
  const errors: LabelFormatError[] = [];

  if (names.some(name => !isPlaceholder(name))) {
    errors.push('unknownPlaceholder');
  }

  if (!names.includes('range') && !names.includes('number')) {
    errors.push('noNumber');
  }

  if (
    counting === 'perYear' &&
    !names.includes('yy') &&
    !names.includes('yyyy')
  ) {
    errors.push('noYear');
  }

  if (format.length > LABEL_FORMAT_MAX_LENGTH) {
    errors.push('tooLong');
  }

  return errors;
}

const defaultFormatFor = (counting: IssueCounting) =>
  counting === 'continuous' ? CONTINUOUS_LABEL_FORMAT : PER_YEAR_LABEL_FORMAT;

/**
 * The numbering as stored. An unknown counting counts per year; a template
 * that is missing or does not fit the counting is that counting's default, so
 * a bad value never breaks a print run.
 */
export function issueNumberingOf(
  counting: unknown,
  format: unknown
): IssueNumberingConfig {
  const valid: IssueCounting =
    counting === 'continuous' ? 'continuous' : 'perYear';

  return {
    counting: valid,
    format:
      typeof format === 'string' && !validateLabelFormat(format, valid).length ?
        format
      : defaultFormatFor(valid),
  };
}

export type ParsedIssueLabel = {
  from: number;
  to: number;
  /** null when the template has no year */
  year: number | null;
};

const SEPARATOR = String.raw`\s*[./-]\s*`;

const escape = (char: string) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A literal part of the template, read leniently. */
const literalPattern = (literal: string): string =>
  [...literal]
    .map(char =>
      /\s/.test(char) ? String.raw`\s*`
      : /[./-]/.test(char) ? SEPARATOR
      : /[\p{L}\p{N}]/u.test(char) ? escape(char)
        // signs such as «#» may be left out
      : `(?:${escape(char)})?\\s*`
    )
    .join('');

const PLACEHOLDER_PATTERNS: Record<Placeholder, string> = {
  range: String.raw`(\d{1,4})(?:\s*[/-]\s*(\d{1,4}))?`,
  number: String.raw`(\d{1,4})`,
  yy: String.raw`(\d{2})`,
  yyyy: String.raw`(\d{4})`,
};

/**
 * Reads an issue label written in the medium's template at the start of a
 * text, e.g. a bexio position «Einzelheft #117». Lenient as people type it:
 * «.», «/» and «-» stand for one another, signs such as «#» may be left out,
 * a double issue may say «117-118». Not part of a date: «31.12.2026» is none.
 */
export function parseIssueLabel(
  text: string,
  format: string = PER_YEAR_LABEL_FORMAT
): ParsedIssueLabel | null {
  const groups: Placeholder[] = [];
  let pattern = '';
  let last = 0;

  for (const match of format.matchAll(TOKEN)) {
    const name = match[1] ?? '';

    pattern += literalPattern(format.slice(last, match.index));
    last = (match.index ?? 0) + match[0].length;

    if (isPlaceholder(name)) {
      pattern += PLACEHOLDER_PATTERNS[name];
      groups.push(name);
      if (name === 'range') {
        // the second number of a double issue has a group of its own
        groups.push('range');
      }
    } else {
      pattern += literalPattern(match[0]);
    }
  }

  pattern += literalPattern(format.slice(last));

  const found = new RegExp(
    String.raw`^\s*${pattern}(?!\d|[./-]\d)`,
    'iu'
  ).exec(text);

  if (!found) {
    return null;
  }

  let from: number | null = null;
  let to: number | null = null;
  let year: number | null = null;
  let rangeSeen = false;

  for (const [index, name] of groups.entries()) {
    const value = found[index + 1];

    if (value === undefined) {
      if (name === 'range') {
        rangeSeen = true;
      }
      continue;
    }

    const n = Number(value);

    if (name === 'range') {
      if (!rangeSeen) {
        from = n;
        rangeSeen = true;
      } else {
        to = n;
      }
    } else if (name === 'number') {
      from = n;
    } else if (name === 'yy') {
      year = 2000 + n;
    } else {
      year = n;
    }
  }

  if (from === null || from < 1 || (to !== null && to <= from)) {
    return null;
  }

  return { from, to: to ?? from, year };
}
