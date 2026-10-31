import { Plugin } from '@puckeditor/core';

import { PuckActionBar } from './action-bar.component';

export const actionBarPlugin: Plugin = {
  name: 'action-bar',
  overrides: {
    actionBar: PuckActionBar,
  },
};

export const themePlugin = actionBarPlugin;
