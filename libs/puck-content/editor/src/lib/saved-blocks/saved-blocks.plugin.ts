import { Plugin } from '@puckeditor/core';

import { SavedBlocksProvider } from './saved-blocks.provider.component';

export const savedBlocksPlugin: Plugin = {
  name: 'saved-blocks',
  overrides: {
    puck: SavedBlocksProvider,
  },
};
