import { ComponentData } from '@puckeditor/core';
import { createContext, useContext } from 'react';

import { PuckDynamicConfig } from '../document/puck-registry';
import { SlotZone } from '../insert/insert.helpers';

export type SavedBlockTemplate = {
  id: string;
  name: string;
  content: ComponentData[];
  types: string[];
  linkedTemplateIds: string[];
  dynamicConfig?: PuckDynamicConfig;
};

export type SavedBlocksInsertMode = 'linked' | 'copy';

export type SavedBlocksContextValue = {
  templates: SavedBlockTemplate[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  search: (name: string) => void;
  canCreate: boolean;
  createPath: string;
  insert: (
    template: SavedBlockTemplate,
    zone: SlotZone,
    mode?: SavedBlocksInsertMode
  ) => void;
  startDrag: (
    template: SavedBlockTemplate,
    mode?: SavedBlocksInsertMode
  ) => void;
  save: (name: string, block: ComponentData) => Promise<void>;
  requestSave: (block: ComponentData) => void;
};

export const SAVED_BLOCKS_CREATE_PATH = '/puck/templates/blocks/create';

export const SavedBlocksContext = createContext<SavedBlocksContextValue | null>(
  null
);

export const useSavedBlocks = () => useContext(SavedBlocksContext);
