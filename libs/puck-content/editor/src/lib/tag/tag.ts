import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { TagFieldRender } from './tag.component';

export const tagPlugin: Plugin<UserFieldsConfig> = {
  name: 'tag',
  overrides: {
    fieldTypes: {
      tag: TagFieldRender,
    },
  },
};
