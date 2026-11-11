import type { z } from 'zod/v4';

const TYPE_KEYS = [
  'string',
  'number',
  'int',
  'boolean',
  'date',
  'array',
  'object',
].map(type => `form.errors.invalid_type.${type}`);

const FORMAT_KEYS = ['email', 'url', 'regex', 'uuid'].map(
  format => `form.errors.invalid_format.${format}`
);

type SizeCode = 'too_small' | 'too_big';

const LENGTH_BOUND: Readonly<Record<SizeCode, string>> = {
  too_small: 'min',
  too_big: 'max',
};

const LENGTH_ORIGINS: ReadonlySet<string> = new Set(['string', 'array']);

const SIZE_ORIGINS: Readonly<Partial<Record<string, string>>> = {
  int: 'number',
};

const SIZE_KEYS = (['too_small', 'too_big'] as const).flatMap(code => [
  `form.errors.${code}.string.${LENGTH_BOUND[code]}`,
  `form.errors.${code}.string.exact`,
  `form.errors.${code}.array.${LENGTH_BOUND[code]}`,
  `form.errors.${code}.array.exact`,
  `form.errors.${code}.number.inclusive`,
  `form.errors.${code}.number.exclusive`,
  `form.errors.${code}.date.inclusive`,
  `form.errors.${code}.date.exclusive`,
]);

export const formErrorKeys: readonly string[] = [
  'form.errors.required',
  'form.errors.invalid',
  'form.errors.invalid_value',
  'form.errors.invalid_format.default',
  'form.errors.not_multiple_of',
  'form.errors.unexpected',
  'form.errors.server',
  ...TYPE_KEYS,
  ...FORMAT_KEYS,
  ...SIZE_KEYS,
];

const knownKeys: ReadonlySet<string> = new Set(formErrorKeys);

const knownOr = (key: string, fallback: string) =>
  knownKeys.has(key) ? key : fallback;

export const isEmptyValue = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

export function defaultIssueKey(issue: z.core.$ZodRawIssue): string {
  switch (issue.code) {
    case 'invalid_type':
      return isEmptyValue(issue.input) ?
          'form.errors.required'
        : knownOr(
            `form.errors.invalid_type.${issue.expected}`,
            'form.errors.invalid'
          );
    case 'invalid_value':
      return isEmptyValue(issue.input) ?
          'form.errors.required'
        : 'form.errors.invalid_value';
    case 'invalid_format':
      return issue.input === '' ?
          'form.errors.required'
        : knownOr(
            `form.errors.invalid_format.${issue.format}`,
            'form.errors.invalid_format.default'
          );
    case 'too_small':
      return isEmptyValue(issue.input) ?
          'form.errors.required'
        : sizeKey('too_small', issue.origin, issue.exact, issue.inclusive);
    case 'too_big':
      return sizeKey('too_big', issue.origin, issue.exact, issue.inclusive);
    case 'not_multiple_of':
      return 'form.errors.not_multiple_of';
    case 'invalid_union':
      return isEmptyValue(issue.input) ?
          'form.errors.required'
        : 'form.errors.invalid';
    default:
      return 'form.errors.invalid';
  }
}

function sizeSuffix(
  code: SizeCode,
  origin: string,
  exact: boolean | undefined,
  inclusive: boolean | undefined
) {
  if (exact) {
    return 'exact';
  }

  if (inclusive === false) {
    return 'exclusive';
  }

  return LENGTH_ORIGINS.has(origin) ? LENGTH_BOUND[code] : 'inclusive';
}

function sizeKey(
  code: SizeCode,
  rawOrigin: string,
  exact: boolean | undefined,
  inclusive: boolean | undefined
) {
  const origin = SIZE_ORIGINS[rawOrigin] ?? rawOrigin;

  return knownOr(
    `form.errors.${code}.${origin}.${sizeSuffix(code, origin, exact, inclusive)}`,
    'form.errors.invalid'
  );
}
