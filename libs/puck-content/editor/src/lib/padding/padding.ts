import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { PaddingFieldRender } from './padding.component';

export const paddingPlugin: Plugin<UserFieldsConfig> = {
  name: 'padding',
  overrides: {
    fieldTypes: {
      padding: PaddingFieldRender,
    },
  },
};
