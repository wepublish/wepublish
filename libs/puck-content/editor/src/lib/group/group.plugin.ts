import { Plugin } from '@puckeditor/core';

import { GroupCanvas, GroupOverlay } from './group.component';

export const groupPlugin: Plugin = {
  name: 'group',
  overrides: {
    iframe: GroupCanvas,
    componentOverlay: GroupOverlay,
  },
};
