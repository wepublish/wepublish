import { inspect } from 'util';

const STATUS_KEYS = ['status', 'statusCode', 'code'];
const TEXT_KEYS = [
  'message',
  'statusMessage',
  'statusText',
  'error',
  'error_description',
  'detail',
  'details',
  'description',
  'reason',
  'data',
  'body',
  // A validation error's reasons, e.g. bexio's 422: a list, or a list per field.
  'errors',
];
const MAX_DESCRIPTION_LENGTH = 500;

export class ErrorWithContext extends Error {
  constructor(
    message: string,
    readonly cause: unknown
  ) {
    super(message);
  }
}

const cap = (text: string) =>
  text.length > MAX_DESCRIPTION_LENGTH ?
    `${text.slice(0, MAX_DESCRIPTION_LENGTH)}…`
  : text;

const readText = (value: unknown, seen: Set<object>): string | undefined => {
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (!value || typeof value !== 'object' || seen.has(value)) {
    return undefined;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return joinTexts(
      value.map(item => readText(item, seen)),
      ', '
    );
  }

  const record = value as Record<string, unknown>;

  return joinTexts(
    TEXT_KEYS.map(key =>
      key === 'errors' ?
        readReasons(record[key], seen)
      : readText(record[key], seen)
    ),
    ': '
  );
};

/** Reasons as a list, or by field: `{mail: ['is invalid']}` → "mail is invalid". */
const readReasons = (value: unknown, seen: Set<object>) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return readText(value, seen);
  }

  return joinTexts(
    Object.entries(value).map(([field, reasons]) => {
      const text = readText(reasons, seen);

      return text && `${field} ${text}`;
    }),
    ', '
  );
};

const joinTexts = (parts: (string | undefined)[], separator: string) => {
  const texts = [...new Set(parts.filter((part): part is string => !!part))];

  // "…the following errors:" already leads into what comes next.
  return texts.length ?
      texts.reduce((joined, text) =>
        joined.endsWith(':') ?
          `${joined} ${text}`
        : `${joined}${separator}${text}`
      )
    : undefined;
};

const describeObject = (value: object): string | undefined => {
  const record = value as Record<string, unknown>;
  const status = STATUS_KEYS.map(key => record[key]).find(
    candidate => typeof candidate === 'number' || typeof candidate === 'string'
  );
  const text = readText(value, new Set());

  if (status !== undefined && text) {
    return text.startsWith(String(status)) ? text : `${status} ${text}`;
  }

  return text ?? (status !== undefined ? String(status) : undefined);
};

export const describeError = (error: unknown): string => {
  if (error === undefined || error === null || error === '') {
    return 'Unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message || error.name;
    const { response } = error as { response?: unknown };
    const answer =
      response && typeof response === 'object' ?
        describeObject(response)
      : undefined;

    return answer && !message.includes(answer) ?
        `${message} (${cap(answer)})`
      : message;
  }

  if (typeof error === 'object') {
    return cap(
      describeObject(error) ??
        inspect(error, { depth: 3, breakLength: Infinity })
    );
  }

  return String(error);
};

export const addErrorContext = (error: unknown, context: string): Error => {
  if (!(error instanceof Error)) {
    return new ErrorWithContext(`${context}: ${describeError(error)}`, error);
  }

  if (error.message.startsWith(`${context}: `)) {
    return error;
  }

  const stackHead =
    error.message ? `${error.name}: ${error.message}` : error.name;
  const message = `${context}: ${describeError(error)}`;

  try {
    error.message = message;
  } catch {
    return new ErrorWithContext(message, error);
  }

  if (error.stack?.startsWith(stackHead)) {
    error.stack = `${error.name}: ${message}${error.stack.slice(stackHead.length)}`;
  }

  return error;
};
