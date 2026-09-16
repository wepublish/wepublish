import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { ApiFieldRender } from './api.component';

export const apiPlugin: Plugin<UserFieldsConfig> = {
  name: 'api',
  overrides: {
    fieldTypes: {
      api: ApiFieldRender,
    },
  },
};
