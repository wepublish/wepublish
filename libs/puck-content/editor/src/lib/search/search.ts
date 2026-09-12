import { Plugin } from '@puckeditor/core';

import { SearchDrawer } from './search.component';

export const searchPlugin: Plugin = {
  name: 'search',
  overrides: {
    drawer: SearchDrawer,
  },
};
