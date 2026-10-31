import { useState } from 'react';

import { areSpacingKeysUniform, SpacingKeysValue } from './box-model';

export const useLinkedSpacingKeys = <Key extends string>(
  value: SpacingKeysValue<Key> | undefined,
  keys: readonly Key[]
) => {
  const [linked, setLinked] = useState(() =>
    areSpacingKeysUniform(value, keys)
  );
  const [seenValue, setSeenValue] = useState(value);

  if (value !== seenValue) {
    setSeenValue(value);

    if (linked && !areSpacingKeysUniform(value, keys)) {
      setLinked(false);
    }
  }

  return [linked, setLinked] as const;
};
