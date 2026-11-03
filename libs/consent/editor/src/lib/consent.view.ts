import { formView, uniqueConstraint } from '@wepublish/form/editor';

import { consentSchema } from './consent.schema';

export const consentView = formView(consentSchema, {
  paths: {
    list: '/consents',
    edit: id => `/consents/edit/${id}`,
  },
  sections: [
    { title: 'consents.consent', fields: ['name', 'slug'] },
    { title: 'consents.defaultValue', fields: ['defaultValue'] },
  ],
  serverErrors: [
    {
      match: uniqueConstraint('slug'),
      path: 'slug',
      error: 'consents.uniqueConstraint',
    },
  ],
});
