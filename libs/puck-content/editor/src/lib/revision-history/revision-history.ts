import { Plugin } from '@puckeditor/core';

import { RevisionHistory } from './revision-history.component';

export const RevisionHistoryPlugin: Plugin = {
  label: 'History',
  name: 'revisioning',
  render: RevisionHistory,
};
