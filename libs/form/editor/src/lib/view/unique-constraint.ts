import { CombinedGraphQLErrors } from '@apollo/client';

export type UniqueViolation = {
  readonly columns: readonly string[] | undefined;
  readonly index: string | undefined;
};

const UNIQUE_FIELDS = /Unique constraint failed on the fields: \(([^)]*)\)/;
const UNIQUE_INDEX = /Unique constraint failed on the constraint: `([^`]+)`/;
const UNIQUE_ANY = /Unique constraint failed/;
const COLUMN = /`([^`]+)`/g;

const messagesOf = (error: unknown): string[] => {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.map(({ message }) => message);
  }

  return error instanceof Error ? [error.message] : [];
};

export function uniqueViolationOf(error: unknown): UniqueViolation | undefined {
  for (const message of messagesOf(error)) {
    const fields = UNIQUE_FIELDS.exec(message);

    if (fields !== null) {
      return {
        columns: [...fields[1].matchAll(COLUMN)].map(([, column]) => column),
        index: undefined,
      };
    }

    const index = UNIQUE_INDEX.exec(message);

    if (index !== null) {
      return { columns: undefined, index: index[1] };
    }

    if (UNIQUE_ANY.test(message)) {
      return { columns: undefined, index: undefined };
    }
  }

  return undefined;
}

const permutations = (items: readonly string[]): string[][] =>
  items.length <= 1 ?
    [[...items]]
  : items.flatMap((item, position) =>
      permutations(items.filter((_, other) => other !== position)).map(rest => [
        item,
        ...rest,
      ])
    );

const sameSet = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every(item => right.includes(item));

export function uniqueConstraint(
  ...columns: readonly string[]
): (error: unknown) => boolean {
  return error => {
    const violation = uniqueViolationOf(error);

    if (violation === undefined) {
      return false;
    }

    if (columns.length === 0) {
      return true;
    }

    const { columns: found, index } = violation;

    if (found !== undefined) {
      return sameSet(found, columns);
    }

    return (
      index !== undefined &&
      permutations(columns).some(order =>
        index.endsWith(`_${order.join('_')}_key`)
      )
    );
  };
}
