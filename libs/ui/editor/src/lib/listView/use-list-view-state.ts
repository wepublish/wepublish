import { useLocalStorage } from '@wepublish/ui';
import { useCallback, useRef } from 'react';

export type ListSortOrder = 'asc' | 'desc';

export type PersistedListViewState<TFilter> = {
  filter: TFilter;
  sortField: string;
  sortOrder: ListSortOrder;
  limit: number;
};

export type UseListViewStateOptions<TFilter> = {
  defaultFilter?: TFilter;
  defaultSortField?: string;
  defaultSortOrder?: ListSortOrder;
  defaultLimit?: number;
};

const STORAGE_PREFIX = 'wepublish:editor:listState:';

const isSortOrder = (value: unknown): value is ListSortOrder =>
  value === 'asc' || value === 'desc';

export const useListViewState = <TFilter = Record<string, unknown>>(
  listKey: string,
  options: UseListViewStateOptions<TFilter> = {}
) => {
  const defaultRef = useRef<PersistedListViewState<TFilter>>();

  if (!defaultRef.current) {
    defaultRef.current = {
      filter: options.defaultFilter ?? ({} as TFilter),
      sortField: options.defaultSortField ?? 'modifiedAt',
      sortOrder: options.defaultSortOrder ?? 'desc',
      limit: options.defaultLimit ?? 10,
    };
  }

  const defaultValue = defaultRef.current;

  const serialize = (value: PersistedListViewState<TFilter>) =>
    JSON.stringify(value);

  const deserialize = (raw: string): PersistedListViewState<TFilter> => {
    try {
      const parsed = JSON.parse(raw);

      if (!parsed || typeof parsed !== 'object') {
        return defaultValue;
      }

      return {
        filter:
          parsed.filter !== undefined && parsed.filter !== null ?
            (parsed.filter as TFilter)
          : defaultValue.filter,
        sortField:
          typeof parsed.sortField === 'string' ?
            parsed.sortField
          : defaultValue.sortField,
        sortOrder:
          isSortOrder(parsed.sortOrder) ?
            parsed.sortOrder
          : defaultValue.sortOrder,
        limit:
          typeof parsed.limit === 'number' && parsed.limit > 0 ?
            parsed.limit
          : defaultValue.limit,
      };
    } catch {
      return defaultValue;
    }
  };

  const [state, , setState, remove] = useLocalStorage<
    PersistedListViewState<TFilter>
  >(`${STORAGE_PREFIX}${listKey}`, { defaultValue, serialize, deserialize });

  const value = state ?? defaultValue;

  const setFilter = useCallback(
    (filter: TFilter | ((previous: TFilter) => TFilter)) => {
      const nextFilter =
        typeof filter === 'function' ?
          (filter as (previous: TFilter) => TFilter)(value.filter)
        : filter;

      setState({ ...value, filter: nextFilter });
    },
    [setState, value]
  );

  const setSort = useCallback(
    (sortField: string, sortOrder: ListSortOrder) => {
      setState({ ...value, sortField, sortOrder });
    },
    [setState, value]
  );

  const setLimit = useCallback(
    (limit: number) => {
      setState({ ...value, limit });
    },
    [setState, value]
  );

  const reset = useCallback(() => {
    remove();
  }, [remove]);

  return {
    filter: value.filter,
    setFilter,
    sortField: value.sortField,
    sortOrder: value.sortOrder,
    setSort,
    limit: value.limit,
    setLimit,
    reset,
  } as const;
};
