import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { TypographyFieldRender } from './typography.component';

export const typographyPlugin: Plugin<UserFieldsConfig> = {
  name: 'typography',
  overrides: {
    fieldTypes: {
      typography: TypographyFieldRender,
    },
  },
};
