import { bindComponent, formView, SelectField } from '@wepublish/form/editor';

import { externalAppSchema } from './externalApp.schema';
import { IconPickerField } from './iconPicker';
import { LinkedApiKeyWarning } from './linkedApiKeyWarning';

export const externalAppRoutes = {
  list: '/dashboard/apps',
  create: '/dashboard/apps/create',
  edit: '/dashboard/apps/edit/:id',
} as const;

const IconPicker = bindComponent(IconPickerField);
const ApiKeySelect = bindComponent(SelectField);

export const externalAppView = formView(externalAppSchema, {
  paths: {
    list: externalAppRoutes.list,
    edit: id => `/dashboard/apps/edit/${id}`,
  },
  sections: [
    {
      fields: ['name', 'description', ['target', 'url'], 'icon', 'apiTokenId'],
      component: LinkedApiKeyWarning,
    },
  ],
  fields: {
    icon: { component: IconPicker },
    apiTokenId: { component: ApiKeySelect },
  },
});
