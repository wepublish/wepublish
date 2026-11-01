import { Plugin } from '@puckeditor/core';

import { BlockLibrary } from './block-library.component';

export const blockLibraryPlugin: Plugin = {
  name: 'block-library',
  overrides: {
    drawer: BlockLibrary,
  },
};
