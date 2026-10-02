import { Prisma } from '@prisma/client';

const DATE_TAG = '$kvDate';
const DECIMAL_TAG = '$kvDecimal';
const ESCAPE_TAG = '$kvEscaped';
const TAGS = [DATE_TAG, DECIMAL_TAG, ESCAPE_TAG];

type TaggedDate = { [DATE_TAG]: string | null };
type TaggedDecimal = { [DECIMAL_TAG]: string };

const isTagged = <T extends string>(
  value: unknown,
  tag: T
): value is Record<T, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length === 1 &&
  tag in value;

const looksTagged = (value: unknown) =>
  !(value instanceof Date) &&
  !Prisma.Decimal.isDecimal(value) &&
  TAGS.some(tag => isTagged(value, tag));

export function serializeCacheValue(value: unknown): string {
  const escaped = new WeakSet<object>();

  return JSON.stringify(
    value,
    function (this: Record<string, unknown>, key, jsonValue) {
      if (escaped.has(this)) {
        return jsonValue;
      }

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

      if (looksTagged(jsonValue)) {
        const items = [jsonValue];
        escaped.add(items);

        return { [ESCAPE_TAG]: items };
      }

      return jsonValue;
    }
  );
}

const reviveProperties = (value: object) =>
  Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, revive(item)])
  );

const revive = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(revive);
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (isTagged(value, ESCAPE_TAG)) {
    const [original] = value[ESCAPE_TAG] as [object];

    return reviveProperties(original);
  }

  if (isTagged(value, DATE_TAG)) {
    return new Date((value as TaggedDate)[DATE_TAG] ?? Number.NaN);
  }

  if (isTagged(value, DECIMAL_TAG)) {
    return new Prisma.Decimal((value as TaggedDecimal)[DECIMAL_TAG]);
  }

  return reviveProperties(value);
};

export function deserializeCacheValue<T>(text: string): T {
  return revive(JSON.parse(text)) as T;
}
