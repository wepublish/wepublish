import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { BlockVisibilityFieldRender } from './block-visibility.component';

export const blockVisibilityPlugin: Plugin<UserFieldsConfig> = {
  name: 'blockVisibility',
  overrides: {
    fieldTypes: {
      blockVisibility: BlockVisibilityFieldRender,
    },
  },
};
