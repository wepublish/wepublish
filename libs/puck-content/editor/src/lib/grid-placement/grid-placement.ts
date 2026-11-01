import { Plugin } from '@puckeditor/core';

import { UserFieldsConfig } from '../fields';
import { GridPlacementFieldRender } from './grid-placement.component';

export const gridPlacementPlugin: Plugin<UserFieldsConfig> = {
  name: 'gridPlacement',
  overrides: {
    fieldTypes: {
      gridPlacement: GridPlacementFieldRender,
    },
  },
};
