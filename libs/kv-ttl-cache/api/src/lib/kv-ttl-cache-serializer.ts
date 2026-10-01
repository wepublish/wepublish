const DATE_TAG = '$kvDate';

type TaggedDate = { [DATE_TAG]: string | null };

const isTaggedDate = (value: unknown): value is TaggedDate =>
  typeof value === 'object' &&
  value !== null &&
  Object.keys(value).length === 1 &&
  DATE_TAG in value;

export function serializeCacheValue(value: unknown): string {
  return JSON.stringify(
    value,
    function (this: Record<string, unknown>, key, jsonValue) {
      const original = this[key];

      if (original instanceof Date) {
        return {
          [DATE_TAG]:
            Number.isNaN(original.getTime()) ? null : original.toISOString(),
        };
      }

      return jsonValue;
    }
  );
}

export function deserializeCacheValue<T>(text: string): T {
  return JSON.parse(text, (_key, value) => {
    if (isTaggedDate(value)) {
      return new Date(value[DATE_TAG] ?? Number.NaN);
    }

    return value;
  });
}
