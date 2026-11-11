import { isPlainObject } from './zod-def';

function copy(value: unknown): unknown {
  if (value instanceof Date) {
    return new Date(value);
  }

  if (Array.isArray(value)) {
    return value.map(copy);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, copy(child)])
    );
  }

  return value;
}

export function snapshotValues<T>(values: T): T {
  return copy(values) as T;
}
