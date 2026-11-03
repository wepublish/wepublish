import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { PaletteFieldRender } from './palette.component';

export const palettePlugin: Plugin<UserFieldsConfig> = {
  name: 'palette',
  overrides: {
    fieldTypes: {
      palette: PaletteFieldRender,
    },
  },
};
