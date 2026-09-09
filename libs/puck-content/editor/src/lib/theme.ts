import { Plugin } from '@puckeditor/core';

import { ThemeActionBar, ThemeHeaderActions } from './theme.component';

export const themePlugin: Plugin = {
  name: 'theme',
  overrides: {
    actionBar: ThemeActionBar,
    headerActions: ThemeHeaderActions,
  },
};
