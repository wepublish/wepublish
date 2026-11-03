import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { StylingFieldRender } from './styling.component';

export const stylingPlugin: Plugin<UserFieldsConfig> = {
  name: 'styling',
  overrides: {
    fieldTypes: {
      styling: StylingFieldRender,
    },
  },
};
