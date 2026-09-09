import { Plugin } from '@puckeditor/core';

import { DatasourceFieldRender } from './datasource.component';
import { UserFieldsConfig } from '../fields';

export const datasourcePlugin: Plugin<UserFieldsConfig> = {
  name: 'datasource',
  overrides: {
    fieldTypes: {
      datasource: DatasourceFieldRender,
    },
  },
};
