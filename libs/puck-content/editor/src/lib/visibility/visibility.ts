import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { VisibilityFieldRender } from './visibility.component';

export const visibilityPlugin: Plugin<UserFieldsConfig> = {
  name: 'visibility',
  overrides: {
    fieldTypes: {
      visibility: VisibilityFieldRender,
    },
  },
};
