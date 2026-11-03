import { Plugin } from '@puckeditor/core';

import { PuckBlockDataProvider } from './puck-block-data.provider.component';

export const puckBlockDataPlugin: Plugin = {
  name: 'puck-block-data',
  overrides: {
    puck: PuckBlockDataProvider,
  },
};
