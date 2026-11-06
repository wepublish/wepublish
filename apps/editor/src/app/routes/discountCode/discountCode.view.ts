import { formView, uniqueConstraint } from '@wepublish/form/editor';

import { discountCodeSchema, upperCaseCode } from './discountCode.schema';

export const discountCodeView = formView(discountCodeSchema, {
  paths: {
    list: '/discountCodes',
    edit: id => `/discountCodes/edit/${id}`,
  },
  sections: [
    {
      title: 'discountCode.form.sections.discount',
      fields: [['code', 'discountPercent'], 'memberPlanId'],
    },
    {
      title: 'discountCode.form.sections.validity',
      fields: [['validFrom', 'validTo']],
    },
  ],
  fields: {
    code: { normalize: upperCaseCode },
  },
  serverErrors: [
    {
      match: uniqueConstraint('code', 'memberPlanId'),
      path: 'code',
      error: 'discountCode.form.codeTaken',
    },
  ],
});
