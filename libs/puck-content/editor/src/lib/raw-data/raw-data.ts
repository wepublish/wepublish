import { Plugin } from '@puckeditor/core';

import { RawDataView } from './raw-data.component';

export const RawDataPlugin: Plugin = {
  name: 'raw-data',
  label: 'Raw Data',
  render: RawDataView,
};
