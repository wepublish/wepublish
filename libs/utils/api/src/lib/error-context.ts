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

  const parts =
    Array.isArray(value) ?
      value.map(item => readText(item, seen))
    : TEXT_KEYS.map(key =>
        readText((value as Record<string, unknown>)[key], seen)
      );

  const texts = [...new Set(parts.filter((part): part is string => !!part))];

  return texts.length ? texts.join(': ') : undefined;
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
