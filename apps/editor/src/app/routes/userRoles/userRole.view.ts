import { formView, uniqueConstraint } from '@wepublish/form/editor';

import { SystemRoleNotice } from './systemRoleNotice';
import { permissionOptions, userRoleSchema } from './userRole.schema';

export const userRoleRoutes = {
  list: '/userroles',
  create: '/userroles/create',
  edit: '/userroles/edit/:id',
} as const;

export const userRoleView = formView(userRoleSchema, {
  paths: {
    list: userRoleRoutes.list,
    edit: id => `/userroles/edit/${id}`,
  },
  sections: [
    { fields: ['name', 'description'], component: SystemRoleNotice },
    { title: 'userRoles.panels.permissions', fields: ['permissions'] },
  ],
  fields: {
    permissions: { hideLabel: true, options: permissionOptions },
  },
  serverErrors: [
    {
      match: uniqueConstraint('name'),
      path: 'name',
      error: 'userRoles.panels.nameTaken',
    },
  ],
});
