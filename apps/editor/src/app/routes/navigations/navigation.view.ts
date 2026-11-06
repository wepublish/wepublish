import { formView, uniqueConstraint } from '@wepublish/form/editor';

import { navigationSchema } from './navigation.schema';

export const navigationRoutes = {
  list: '/navigations',
  create: '/navigations/create',
  edit: '/navigations/edit/:id',
} as const;

export const navigationView = formView(navigationSchema, {
  paths: {
    list: navigationRoutes.list,
    edit: id => `/navigations/edit/${id}`,
  },
  sections: [
    { fields: [['name', 'key']] },
    { title: 'navigation.panels.links', fields: ['links'] },
  ],
  fields: {
    links: {
      props: { sortable: true, addLabel: 'navigation.panels.addLink' },
    },
  },
  serverErrors: [
    {
      match: uniqueConstraint('key'),
      path: 'key',
      error: 'navigation.panels.keyTaken',
    },
  ],
});
