import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { GapFieldRender } from './gap.component';

export const gapPlugin: Plugin<UserFieldsConfig> = {
  name: 'gap',
  overrides: {
    fieldTypes: {
      gap: GapFieldRender,
    },
  },
};
