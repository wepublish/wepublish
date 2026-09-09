import { Plugin } from '@puckeditor/core';

import { AlignmentFieldRender } from './alignment.component';
import { UserFieldsConfig } from '../fields';

export const alignmentPlugin: Plugin<UserFieldsConfig> = {
  name: 'alignment',
  overrides: {
    fieldTypes: {
      alignment: AlignmentFieldRender,
    },
  },
};
