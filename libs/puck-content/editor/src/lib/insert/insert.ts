import { Plugin } from '@puckeditor/core';

import { InsertDrawerItem, KeepSelectionOnInsert } from './insert.component';

export const insertPlugin: Plugin = {
  name: 'insert',
  overrides: {
    drawerItem: InsertDrawerItem,
    puck: KeepSelectionOnInsert,
  },
};
