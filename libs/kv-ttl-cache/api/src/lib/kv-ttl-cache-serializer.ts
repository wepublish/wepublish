const DATE_TAG = '$kvDate';
const DECIMAL_TAG = '$kvDecimal';
const ESCAPE_TAG = '$kvEscaped';
const TAGS = [DATE_TAG, DECIMAL_TAG, ESCAPE_TAG];

export type DecimalCodec = {
  isDecimal(value: unknown): value is { toString(): string };
  fromString(value: string): unknown;
};

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

const looksTagged = (value: unknown, decimal?: DecimalCodec) =>
  !(value instanceof Date) &&
  !decimal?.isDecimal(value) &&
  TAGS.some(tag => isTagged(value, tag));

export function serializeCacheValue(
  value: unknown,
  decimal?: DecimalCodec
): string {
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

      if (decimal?.isDecimal(original)) {
        return {
          [DECIMAL_TAG]: original.toString(),
        } satisfies TaggedDecimal;
      }

      if (looksTagged(jsonValue, decimal)) {
        const items = [jsonValue];
        escaped.add(items);

        return { [ESCAPE_TAG]: items };
      }

      return jsonValue;
    }
  );
}

const reviveProperties = (value: object, decimal?: DecimalCodec) =>
  Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, revive(item, decimal)])
  );

const revive = (value: unknown, decimal?: DecimalCodec): unknown => {
  if (Array.isArray(value)) {
    return value.map(item => revive(item, decimal));
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (isTagged(value, ESCAPE_TAG)) {
    const [original] = value[ESCAPE_TAG] as [object];

    return reviveProperties(original, decimal);
  }

  if (isTagged(value, DATE_TAG)) {
    return new Date((value as TaggedDate)[DATE_TAG] ?? Number.NaN);
  }

  if (decimal && isTagged(value, DECIMAL_TAG)) {
    return decimal.fromString((value as TaggedDecimal)[DECIMAL_TAG]);
  }

  return reviveProperties(value, decimal);
};

export function deserializeCacheValue<T>(
  text: string,
  decimal?: DecimalCodec
): T {
  return revive(JSON.parse(text), decimal) as T;
}

export function serializeCacheValueIfPossible(
  value: unknown,
  decimal?: DecimalCodec
): string | undefined {
  try {
    return serializeCacheValue(value, decimal);
  } catch {
    return undefined;
  }
}

export function deserializeCacheValueIfPossible<T>(
  text: string,
  decimal?: DecimalCodec
): T | undefined {
  try {
    return deserializeCacheValue<T>(text, decimal);
  } catch {
    return undefined;
  }
}
