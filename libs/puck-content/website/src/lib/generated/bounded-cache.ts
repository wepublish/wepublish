export type BoundedCache<Key, Value> = {
  get: (key: Key, build: () => Value) => Value;
  peek: (key: Key) => Value | undefined;
};

export const createBoundedCache = <Key, Value>(
  limit: number
): BoundedCache<Key, Value> => {
  const entries = new Map<Key, Value>();

  return {
    get: (key, build) => {
      const value = entries.has(key) ? (entries.get(key) as Value) : build();

      entries.delete(key);
      entries.set(key, value);

      if (entries.size > limit) {
        entries.delete(entries.keys().next().value as Key);
      }

      return value;
    },
    peek: key => entries.get(key),
  };
};
