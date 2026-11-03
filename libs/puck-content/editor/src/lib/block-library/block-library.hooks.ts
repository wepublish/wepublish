import { createUsePuck } from '@puckeditor/core';
import { createContext, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { SlotZone } from '../insert/insert.helpers';
import { blockCatalog } from './block-library.catalog';
import {
  blockCategoryKey,
  blockGroupHintKey,
  blockGroupKey,
} from './block-library.helpers';

const usePuck = createUsePuck();

const groupIds = new Set<string>(
  blockCatalog.flatMap(category =>
    'group' in category ? [category.group] : []
  )
);

export const useBlockLabels = () => {
  const { t } = useTranslation();
  const components = usePuck(puck => puck.config.components);

  const labelOf = useCallback(
    (key: string) => {
      if (key in components) {
        const { nameKey, label } = components[key] ?? {};
        const fallback = label ?? key;

        return nameKey ? t(nameKey, { defaultValue: fallback }) : fallback;
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
