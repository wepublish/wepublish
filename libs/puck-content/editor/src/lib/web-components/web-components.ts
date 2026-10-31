import { Plugin } from '@puckeditor/core';

import { CustomElementsBridge } from './web-components.component';

export const webComponentsPlugin: Plugin = {
  name: 'web-components',
  overrides: {
    iframe: CustomElementsBridge,
  },
};
