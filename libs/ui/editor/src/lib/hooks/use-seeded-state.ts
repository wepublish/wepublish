import { useState } from 'react';

const NOTHING = Symbol('unseeded');

export function useSeededState<T>(
  source: T | null | undefined,
  seed: (value: T) => void,
  key?: unknown
) {
  const identity = key === undefined ? source : key;
  const [seeded, setSeeded] = useState<unknown>(NOTHING);

  if (source != null && !Object.is(identity, seeded)) {
    setSeeded(identity);
    seed(source);
  }
}
