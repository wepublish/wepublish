import { formView } from '@wepublish/form/editor';

import { goodieSchema } from './goodie.schema';

export const goodieView = formView(goodieSchema, {
  paths: {
    list: '/goodies',
    edit: id => `/goodies/edit/${id}`,
  },
  sections: [
    {
      title: 'goodie.form.sections.details',
      fields: ['name', 'description'],
    },
    {
      title: 'goodie.form.sections.availability',
      fields: ['active', 'memberPlanIDs', 'paymentPeriodicities', 'stock'],
    },
    {
      title: 'goodie.form.sections.media',
      placement: 'aside',
      fields: ['image'],
    },
  ],
});
