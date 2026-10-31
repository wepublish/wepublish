import { createUsePuck } from '@puckeditor/core';
import { useCallback, useMemo } from 'react';

import { usePuckDocumentKindLabel } from '../document-kind/document-kind';
import { insertZones, SlotZone } from './insert.helpers';

const usePuck = createUsePuck();

export const useSlotInsert = () => {
  const config = usePuck(puck => puck.config);
  const dispatch = usePuck(puck => puck.dispatch);
  const selectedItem = usePuck(puck => puck.selectedItem);
  const rootCount = usePuck(puck => puck.appState.data.content.length);
  const rootLabel = usePuckDocumentKindLabel();

  const zones = useMemo(
    () =>
      insertZones(config, selectedItem, { label: rootLabel, count: rootCount }),
    [config, selectedItem, rootLabel, rootCount]
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
