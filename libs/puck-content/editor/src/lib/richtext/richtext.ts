import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { RichtextFieldRender } from './richtext.component';

export const richtextPlugin: Plugin<UserFieldsConfig> = {
  name: 'richtext',
  overrides: {
    fieldTypes: {
      richtext: RichtextFieldRender,
    },
  },
  fieldTransforms: {
    richtext: ({ value }) => value,
  },
};
