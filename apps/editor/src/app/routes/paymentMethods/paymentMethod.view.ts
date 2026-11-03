import { bindComponent, formView, SelectField } from '@wepublish/form/editor';
import { slugify } from '@wepublish/utils';

import { paymentMethodSchema } from './paymentMethod.schema';

export const paymentMethodRoutes = {
  list: '/paymentmethods',
  create: '/paymentmethods/create',
  edit: '/paymentmethods/edit/:id',
} as const;

const ProviderSelect = bindComponent(SelectField);

export const paymentMethodView = formView(paymentMethodSchema, {
  paths: {
    list: paymentMethodRoutes.list,
    edit: id => `/paymentmethods/edit/${id}`,
  },
  sections: [
    { fields: [['name', 'slug'], 'description', 'active'] },
    {
      title: 'paymentMethodList.payment',
      fields: ['paymentProviderID', 'gracePeriod'],
    },
    { title: 'paymentMethodList.image', fields: ['image'] },
  ],
  fields: {
    name: {
      onValueChange: (name, { setValue }) => setValue('slug', slugify(name)),
    },
    slug: { readOnly: true },
    paymentProviderID: { component: ProviderSelect },
    gracePeriod: { props: { unit: 'paymentMethodEditPanel.days' } },
    image: { hideLabel: true },
  },
});
