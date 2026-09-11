import { useLocalStorage } from '@wepublish/ui';
import { useCallback, useMemo } from 'react';

export type ColumnConfigColumn = {
  id: string;
  alwaysVisible?: boolean;
};

const STORAGE_PREFIX = 'wepublish:editor:columns:';

const EMPTY_HIDDEN: string[] = [];

const serialize = (value: string[]) => JSON.stringify(value);

const deserialize = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
};

export const useColumnConfig = (
  listKey: string,
  columns: ReadonlyArray<ColumnConfigColumn>
) => {
  const [hidden, , setHidden] = useLocalStorage<string[]>(
    `${STORAGE_PREFIX}${listKey}`,
    { defaultValue: EMPTY_HIDDEN, serialize, deserialize }
  );

  const hiddenSet = useMemo(() => new Set(hidden ?? []), [hidden]);

  const alwaysVisibleIds = useMemo(
    () => new Set(columns.filter(c => c.alwaysVisible).map(c => c.id)),
    [columns]
  );

  const isVisible = useCallback(
    (id: string) => alwaysVisibleIds.has(id) || !hiddenSet.has(id),
    [alwaysVisibleIds, hiddenSet]
  );

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(hiddenSet);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setHidden([...next]);
    },
    [hiddenSet, setHidden]
  );

  const reset = useCallback(() => setHidden([]), [setHidden]);

  return { isVisible, toggle, reset } as const;
};
