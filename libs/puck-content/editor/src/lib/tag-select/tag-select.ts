import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { TagSelectFieldRender } from './tag-select.component';

export const tagSelectPlugin: Plugin<UserFieldsConfig> = {
  name: 'tagSelect',
  overrides: {
    fieldTypes: {
      tagSelect: TagSelectFieldRender,
    },
  },
};
