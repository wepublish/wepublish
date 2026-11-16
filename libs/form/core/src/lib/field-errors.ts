import { joinPath } from './field-path';
import type { FormFieldError } from './schema-resolver';

export type FlatFieldError = { path: string; error: FormFieldError };

const ERROR_KEYS: ReadonlySet<string> = new Set([
  'type',
  'message',
  'ref',
  'types',
  'params',
]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isFieldError = (value: unknown): value is FormFieldError =>
  isObject(value) &&
  typeof value['message'] === 'string' &&
  typeof value['type'] === 'string';

const children = (error: Record<string, unknown>) =>
  Object.entries(error).filter(
    ([key]) => !isFieldError(error) || !ERROR_KEYS.has(key)
  );

function firstNestedError(error: unknown): FormFieldError | undefined {
  if (isFieldError(error)) {
    return error;
  }

  if (!isObject(error)) {
    return undefined;
  }

  for (const [, child] of children(error)) {
    const found = firstNestedError(child);

    if (found) {
      return found;
    }
  }

  return undefined;
}

export function fieldErrorOf(
  error: unknown,
  container: boolean
): FormFieldError | undefined {
  if (!container) {
    return firstNestedError(error);
  }

  if (isFieldError(error)) {
    return error;
  }

  return isObject(error) && isFieldError(error['root']) ?
      error['root']
    : undefined;
}

export function flattenErrors(errors: unknown, prefix = ''): FlatFieldError[] {
  if (!isObject(errors)) {
    return [];
  }

  const own =
    isFieldError(errors) && prefix !== '' ?
      [{ path: prefix, error: errors }]
    : [];

  return [
    ...own,
    ...children(errors).flatMap(([key, child]) =>
      flattenErrors(child, joinPath(prefix, key))
    ),
  ];
}
