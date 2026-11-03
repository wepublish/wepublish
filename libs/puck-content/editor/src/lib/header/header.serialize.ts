import { Data } from '@puckeditor/core';

const hasToJSON = (value: object): value is { toJSON: () => unknown } =>
  'toJSON' in value && typeof value.toJSON === 'function';

const normalize = (value: unknown): unknown => {
  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map(item => normalize(item) ?? null);
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (hasToJSON(value)) {
    return normalize(value.toJSON());
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .flatMap(([key, entry]) => {
        const normalized = normalize(entry);

        return normalized === undefined ? [] : [[key, normalized]];
      })
  );
};

export const serializeDocument = (data: Partial<Data>): string => {
  const zones = Object.fromEntries(
    Object.entries(data.zones ?? {}).filter(([, content]) => content.length)
  );

  return JSON.stringify(
    normalize({
      root: { ...data.root, props: data.root?.props ?? {} },
      content: data.content ?? [],
      zones: Object.keys(zones).length ? zones : undefined,
    })
  );
};
