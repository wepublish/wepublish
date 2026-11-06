import { type DateShortcut, formView } from '@wepublish/form/editor';

import {
  apiTokenSchema,
  endOfDay,
  inDays,
  MAX_LIFETIME_YEARS,
} from './apiToken.schema';
import { LongLivedWarning } from './longLivedWarning';

export const apiTokenRoutes = {
  list: '/api-tokens',
  generate: '/api-tokens/generate',
} as const;

const expiryShortcuts: readonly DateShortcut[] = [
  { label: 'apiTokenList.panels.in30Days', date: () => inDays(30) },
  { label: 'apiTokenList.panels.in90Days', date: () => inDays(90) },
  { label: 'apiTokenList.panels.inAYear', date: () => inDays(365) },
  {
    label: 'apiTokenList.panels.in3Years',
    date: () => inDays(365 * MAX_LIFETIME_YEARS),
  },
];

export const apiTokenView = formView(apiTokenSchema, {
  sections: [
    { fields: ['name', 'expiresAt'], component: LongLivedWarning },
    { title: 'apiTokenList.panels.scopes', fields: ['scopes'] },
  ],
  fields: {
    scopes: { hideLabel: true },
    expiresAt: { normalize: endOfDay, props: { shortcuts: expiryShortcuts } },
  },
});
