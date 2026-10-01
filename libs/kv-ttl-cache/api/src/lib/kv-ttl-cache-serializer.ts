import { Prisma } from '@prisma/client';

const DATE_TAG = '$kvDate';
const DECIMAL_TAG = '$kvDecimal';

type TaggedDate = { [DATE_TAG]: string | null };
type TaggedDecimal = { [DECIMAL_TAG]: string };

const isTagged = <T extends string>(
  value: unknown,
  tag: T
): value is Record<T, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  Object.keys(value).length === 1 &&
  tag in value;

export function serializeCacheValue(value: unknown): string {
  return JSON.stringify(
    value,
    function (this: Record<string, unknown>, key, jsonValue) {
      const original = this[key];

      if (original instanceof Date) {
        return {
          [DATE_TAG]:
            Number.isNaN(original.getTime()) ? null : original.toISOString(),
        } satisfies TaggedDate;
      }

      if (Prisma.Decimal.isDecimal(original)) {
        return {
          [DECIMAL_TAG]: original.toString(),
        } satisfies TaggedDecimal;
      }

      return jsonValue;
    }
  );
}

export function deserializeCacheValue<T>(text: string): T {
  return JSON.parse(text, (_key, value) => {
    if (isTagged(value, DATE_TAG)) {
      return new Date((value as TaggedDate)[DATE_TAG] ?? Number.NaN);
    }

    if (isTagged(value, DECIMAL_TAG)) {
      return new Prisma.Decimal((value as TaggedDecimal)[DECIMAL_TAG]);
    }

    return value;
  });
}
