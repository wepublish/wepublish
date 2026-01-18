import { Plugin } from '@puckeditor/core';
import { History } from 'lucide-react';

import { RevisionHistory } from './revision-history.component';

export const RevisionHistoryPlugin: Plugin = {
  icon: <History />,
  label: 'History',
  name: 'revisioning',
  render: RevisionHistory,
};
