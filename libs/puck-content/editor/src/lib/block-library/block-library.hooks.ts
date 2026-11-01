import { createUsePuck } from '@puckeditor/core';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SlotZone } from '../insert/insert.helpers';
import { blockCatalog, catalogBlockNames } from './block-library.catalog';
import {
  blockCategoryKey,
  blockGroupHintKey,
  blockGroupKey,
  blockLabelKey,
} from './block-library.helpers';

const usePuck = createUsePuck();

const groupIds = new Set(
  blockCatalog.flatMap(({ group }) => (group ? [group.id] : []))
);

export const useBlockLabels = () => {
  const { t } = useTranslation();
  const components = usePuck(puck => puck.config.components);

  const labelOf = useCallback(
    (key: string) => {
      if (key in components) {
        return t(blockLabelKey(key), {
          defaultValue: components[key]?.label ?? key,
        });
      }

      return groupIds.has(key) ?
          t(blockGroupKey(key))
        : t(blockCategoryKey(key), { defaultValue: key });
    },
    [components, t]
  );

  const hintOf = useCallback(
    (groupId: string) => t(blockGroupHintKey(groupId)),
    [t]
  );

  return { labelOf, hintOf };
};

export const useUncategorisedBlocks = () => {
  const components = usePuck(puck => puck.config.components);

  return useMemo(() => {
    const listed = new Set<string>(catalogBlockNames(blockCatalog));

    return Object.keys(components).filter(name => !listed.has(name));
  }, [components]);
};

export type BlockLibraryContextValue = {
  labelOf: (key: string) => string;
  targetsFor: (type: string) => SlotZone[];
  insert: (type: string, zone: SlotZone) => void;
  notHere: string;
  chooseSlot: string;
};

export const BlockLibraryContext =
  createContext<BlockLibraryContextValue | null>(null);

export const useBlockLibrary = () => {
  const value = useContext(BlockLibraryContext);

  if (!value) {
    throw new Error('useBlockLibrary needs a BlockLibraryContext');
  }

  return value;
};
