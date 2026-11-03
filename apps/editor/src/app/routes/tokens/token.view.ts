import { formView, uniqueConstraint } from '@wepublish/form/editor';

import { tokenSchema } from './token.schema';

export const tokenRoutes = {
  list: '/tokens',
  generate: '/tokens/generate',
} as const;

export const tokenView = formView(tokenSchema, {
  sections: [{ fields: ['name'] }],
  serverErrors: [
    {
      match: uniqueConstraint('name'),
      path: 'name',
      error: 'tokenList.panels.nameTaken',
    },
  ],
});
