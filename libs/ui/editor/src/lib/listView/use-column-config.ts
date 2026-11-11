import { useLocalStorage } from '@wepublish/ui';
import { ReactNode, useCallback, useMemo } from 'react';

import { ColumnConfiguratorColumn } from './column-configurator';

export type ColumnConfigColumn = {
  id: string;
  label?: ReactNode;
  columnLabel?: string;
  alwaysVisible?: boolean;
  fixed?: boolean;
  /** Hidden until the user switches it on in the column menu. */
  defaultHidden?: boolean;
};

type ColumnConfig = {
  hidden: string[];
  order: string[];
  /** Default-hidden columns the user switched on. */
  shown: string[];
};

const STORAGE_PREFIX = 'wepublish:editor:columns:';

const EMPTY_CONFIG: ColumnConfig = { hidden: [], order: [], shown: [] };

const ids = (value: unknown): string[] =>
  Array.isArray(value) ?
    value.filter((id): id is string => typeof id === 'string')
  : [];

const serialize = (value: ColumnConfig) => JSON.stringify(value);

const deserialize = (value: string): ColumnConfig => {
  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return { hidden: ids(parsed), order: [], shown: [] };
    }

    return {
      hidden: ids(parsed?.hidden),
      order: ids(parsed?.order),
      shown: ids(parsed?.shown),
    };
  } catch {
    return EMPTY_CONFIG;
  }
};

const nameOf = (column: ColumnConfigColumn) =>
  column.columnLabel ?? (typeof column.label === 'string' ? column.label : '');

const isConfigurable = (column: ColumnConfigColumn) =>
  !column.alwaysVisible && !column.fixed && Boolean(nameOf(column));

const isMovable = (column: ColumnConfigColumn) =>
  !column.fixed && Boolean(nameOf(column));

export const useColumnConfig = (
  listKey: string | undefined,
  columns: ReadonlyArray<ColumnConfigColumn>
) => {
  const [config, , setConfig] = useLocalStorage<ColumnConfig>(
    `${STORAGE_PREFIX}${listKey ?? ''}`,
    { defaultValue: EMPTY_CONFIG, serialize, deserialize }
  );

  const stored = listKey ? (config ?? EMPTY_CONFIG) : EMPTY_CONFIG;

  const configurableIds = useMemo(
    () => new Set(columns.filter(isConfigurable).map(column => column.id)),
    [columns]
  );

  const defaultHiddenIds = useMemo(
    () =>
      new Set(
        columns
          .filter(column => isConfigurable(column) && column.defaultHidden)
          .map(column => column.id)
      ),
    [columns]
  );

  // what the user hid, plus the default-hidden columns they did not switch on
  const hiddenSet = useMemo(() => {
    const shown = new Set(stored.shown);
    const hidden = new Set(stored.hidden);
    defaultHiddenIds.forEach(id => {
      if (!shown.has(id)) {
        hidden.add(id);
      }
    });
    return hidden;
  }, [defaultHiddenIds, stored.hidden, stored.shown]);

  const movableIds = useMemo(
    () => columns.filter(isMovable).map(column => column.id),
    [columns]
  );

  const order = useMemo(() => {
    const known = new Set(movableIds);
    const kept = stored.order.filter(id => known.has(id));
    const keptSet = new Set(kept);

    return [...kept, ...movableIds.filter(id => !keptSet.has(id))];
  }, [movableIds, stored.order]);

  const isVisible = useCallback(
    (id: string) => !configurableIds.has(id) || !hiddenSet.has(id),
    [configurableIds, hiddenSet]
  );

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(hiddenSet);
      const isDefaultHidden = defaultHiddenIds.has(id);

      if (next.has(id)) {
        setConfig(
          isDefaultHidden ?
            { ...stored, shown: [...stored.shown, id] }
          : { ...stored, hidden: stored.hidden.filter(h => h !== id) }
        );
        return;
      }

      const keepsAColumn = columns.length > configurableIds.size;
      const lastOne = [...configurableIds].every(
        columnId => columnId === id || next.has(columnId)
      );
      if (lastOne && !keepsAColumn) {
        return;
      }

      setConfig(
        isDefaultHidden ?
          { ...stored, shown: stored.shown.filter(shownId => shownId !== id) }
        : { ...stored, hidden: [...stored.hidden, id] }
      );
    },
    [columns, configurableIds, defaultHiddenIds, hiddenSet, setConfig, stored]
  );

  const move = useCallback(
    (id: string, before: string) => {
      const from = order.indexOf(id);
      const to = order.indexOf(before);

      if (from < 0 || to < 0 || from === to) {
        return;
      }

      const next = [...order];
      next.splice(to, 0, ...next.splice(from, 1));

      setConfig({ ...stored, order: next });
    },
    [order, setConfig, stored]
  );

  const reset = useCallback(() => setConfig(EMPTY_CONFIG), [setConfig]);

  const isCustomised =
    stored.hidden.length > 0 ||
    stored.order.length > 0 ||
    stored.shown.length > 0;

  const orderColumns = useCallback(
    <T extends ColumnConfigColumn>(all: ReadonlyArray<T>): T[] => {
      const byId = new Map(all.map(column => [column.id, column]));
      const movable = order
        .map(id => byId.get(id))
        .filter((column): column is T => !!column);

      let next = 0;

      return all.map(column =>
        isMovable(column) ? (movable[next++] ?? column) : column
      );
    },
    [order]
  );

  const hiddenColumns = useMemo(
    () =>
      columns
        .filter(column => isConfigurable(column) && hiddenSet.has(column.id))
        .map(column => column.id),
    [columns, hiddenSet]
  );

  const menuColumns = useMemo<ColumnConfiguratorColumn[]>(
    () =>
      orderColumns(columns.filter(isMovable)).map(column => ({
        id: column.id,
        label: nameOf(column),
        canHide: isConfigurable(column),
      })),
    [columns, orderColumns]
  );

  return {
    isVisible,
    toggle,
    move,
    reset,
    orderColumns,
    isCustomised,
    menuColumns,
    hiddenColumns,
  } as const;
};
