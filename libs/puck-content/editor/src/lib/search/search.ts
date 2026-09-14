import { Plugin } from '@puckeditor/core';

import { SearchDrawer } from './search.component';

export const SearchPlugin: Plugin = {
  name: 'search',
  overrides: {
    drawer: SearchDrawer,
  },
};
