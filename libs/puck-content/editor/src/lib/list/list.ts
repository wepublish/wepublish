import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { ListFieldRender } from './list.component';

export const listPlugin: Plugin<UserFieldsConfig> = {
  name: 'list',
  overrides: {
    fieldTypes: {
      list: ListFieldRender,
    },
  },
};
