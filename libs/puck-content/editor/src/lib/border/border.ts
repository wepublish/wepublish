import { Plugin } from '@puckeditor/core';

import { BorderFieldRender } from './border.component';
import { UserFieldsConfig } from '../fields';

export const borderPlugin: Plugin<UserFieldsConfig> = {
  name: 'border',
  overrides: {
    fieldTypes: {
      border: BorderFieldRender,
    },
  },
};
