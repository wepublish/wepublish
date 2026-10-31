import { Plugin } from '@puckeditor/core';

import { BreakpointsFieldRender } from './breakpoints.component';
import { UserFieldsConfig } from '../fields';

export const breakpointsPlugin: Plugin<UserFieldsConfig> = {
  name: 'breakpoints',
  overrides: {
    fieldTypes: {
      breakpoints: BreakpointsFieldRender,
    },
  },
};
