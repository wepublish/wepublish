import { Plugin } from '@puckeditor/core';

import { ColumnsFieldRender } from './columns.component';
import { UserFieldsConfig } from '../fields';

export const columnsPlugin: Plugin<UserFieldsConfig> = {
  name: 'columns',
  overrides: {
    fieldTypes: {
      columns: ColumnsFieldRender,
    },
  },
};
