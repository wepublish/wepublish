import { formView, uniqueConstraint } from '@wepublish/form/editor';

import { userConsentSchema } from './user-consent.schema';

export const userConsentView = formView(userConsentSchema, {
  paths: {
    list: '/userConsents',
    edit: id => `/userConsents/edit/${id}`,
  },
  sections: [
    {
      title: 'userConsents.sections.assignment',
      description: 'userConsents.sections.assignmentInfo',
      fields: ['user', 'consent'],
    },
    { title: 'userConsents.sections.decision', fields: ['value'] },
  ],
  serverErrors: [
    {
      match: uniqueConstraint('userId', 'consentId'),
      path: 'consent',
      error: 'userConsents.alreadyExists',
      modes: ['create'],
    },
  ],
});
