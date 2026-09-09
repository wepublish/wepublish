import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { ImageFieldRender } from './image.component';

export const imagePlugin: Plugin<UserFieldsConfig> = {
  name: 'image',
  overrides: {
    fieldTypes: {
      image: ImageFieldRender,
    },
  },
};
