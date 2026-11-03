import { Plugin } from '@puckeditor/core';

import { ViewportSelection } from './viewport-selection.component';

export const viewportSelectionPlugin: Plugin = {
  name: 'viewport-selection',
  overrides: {
    puck: ViewportSelection,
  },
};
