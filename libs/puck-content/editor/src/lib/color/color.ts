import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { ColorFieldRender } from './color.component';

export const colorPlugin: Plugin<UserFieldsConfig> = {
  name: 'color',
  overrides: {
    fieldTypes: {
      color: ColorFieldRender,
    },
  },
};
