import { Plugin } from '@puckeditor/core';

import { InsertDrawerItem } from './insert.component';

export const insertPlugin: Plugin = {
  name: 'insert',
  overrides: {
    drawerItem: InsertDrawerItem,
  },
};
