import { Plugin } from '@puckeditor/core';

import { VisibilityOutline } from './visibility-outline.component';

export const visibilityOutlinePlugin: Plugin = {
  name: 'visibility-outline',
  overrides: {
    outline: VisibilityOutline,
  },
};
