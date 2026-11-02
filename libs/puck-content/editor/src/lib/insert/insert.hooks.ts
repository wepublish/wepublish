import { createUsePuck } from '@puckeditor/core';
import { useCallback, useMemo } from 'react';

import { usePuckDocumentKindLabel } from '../document-kind/document-kind';
import {
  InsertContext,
  insertMode,
  insertTargets,
  SlotZone,
} from './insert.helpers';

const usePuck = createUsePuck();

const parentId = (zone: string | undefined) => zone?.split(':')[0];

export const useSlotInsert = () => {
  const config = usePuck(puck => puck.config);
  const dispatch = usePuck(puck => puck.dispatch);
  const selected = usePuck(puck => puck.selectedItem);
  const selector = usePuck(puck => puck.appState.ui.itemSelector);
  const getItemById = usePuck(puck => puck.getItemById);
  const rootCount = usePuck(puck => puck.appState.data.content.length);

  const rootLabel = usePuckDocumentKindLabel();

  const parentKey = parentId(selector?.zone);
  const parent = useMemo(
    () => (parentKey && parentKey !== 'root' ? getItemById(parentKey) : null),
    [getItemById, parentKey]
  );

  const context = useMemo<InsertContext>(
    () => ({
      selected,
      selector,
      parent,
      root: { label: rootLabel, count: rootCount },
    }),
    [selected, selector, parent, rootLabel, rootCount]
  );

  const mode = useMemo(() => insertMode(config, selected), [config, selected]);

  const targetsFor = useCallback(
    (type: string) => insertTargets(config, type, context),
    [config, context]
  );

  const insert = useCallback(
    (componentType: string, zone: SlotZone) => {
      const index = zone.index ?? zone.count;

      dispatch({
        type: 'insert',
        componentType,
        id: `${componentType}-${crypto.randomUUID()}`,
        destinationIndex: index,
        destinationZone: zone.zone,
      });
      dispatch({
        type: 'setUi',
        ui: { itemSelector: { index, zone: zone.zone } },
      });
    },
    [dispatch]
  );

  return { mode, selected, targetsFor, insert };
};
