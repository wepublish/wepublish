import { createUsePuck, useGetPuck } from '@puckeditor/core';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  collectBlockIds,
  initialSelectionMemory,
  insertZones,
  nextSelectionMemory,
  SlotZone,
} from './insert.helpers';

const usePuck = createUsePuck();

export const useSlotInsert = () => {
  const config = usePuck(puck => puck.config);
  const dispatch = usePuck(puck => puck.dispatch);
  const selectedItem = usePuck(puck => puck.selectedItem);
  const rootCount = usePuck(puck => puck.appState.data.content.length);

  const zones = useMemo(
    () => insertZones(config, selectedItem, rootCount),
    [config, selectedItem, rootCount]
  );

  const insert = useCallback(
    (componentType: string, zone: SlotZone) =>
      dispatch({
        type: 'insert',
        componentType,
        destinationIndex: zone.count,
        destinationZone: zone.zone,
      }),
    [dispatch]
  );

  return { zones, insert };
};

export const useKeepSelectionOnInsert = () => {
  const getPuck = useGetPuck();
  const selectedId = usePuck(puck => puck.selectedItem?.props.id ?? null);
  const content = usePuck(puck => puck.appState.data.content);
  const isDragging = usePuck(puck => puck.appState.ui.isDragging);
  const memory = useRef(initialSelectionMemory());

  useEffect(() => {
    const result = nextSelectionMemory(memory.current, {
      selectedId,
      ids: collectBlockIds(content),
      isDragging,
    });

    memory.current = result.memory;

    if (!result.restore) {
      return;
    }

    const { dispatch, getSelectorForId } = getPuck();
    const { id } = result.restore;

    dispatch({
      type: 'setUi',
      ui: { itemSelector: id ? (getSelectorForId(id) ?? null) : null },
    });
  }, [getPuck, selectedId, content, isDragging]);
};
