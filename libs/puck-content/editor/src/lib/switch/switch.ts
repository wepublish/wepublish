import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { SwitchFieldRender } from './switch.component';

export const switchPlugin: Plugin<UserFieldsConfig> = {
  name: 'switch',
  overrides: {
    fieldTypes: {
      switch: SwitchFieldRender,
    },
  },
};
