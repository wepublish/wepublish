import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { RecordFieldRender } from './record-select.component';

export const recordPlugin: Plugin<UserFieldsConfig> = {
  name: 'record',
  overrides: {
    fieldTypes: {
      record: RecordFieldRender,
    },
  },
};
