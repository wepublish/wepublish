import {
  bindComponent,
  formView,
  MultiSelectField,
} from '@wepublish/form/editor';

import { userCreateSchema, userSchema } from './user.schema';
import { UserAccessActions } from './userAccessActions';
import { UserMails } from './userMails';
import { UserPropertyRow } from './userPropertyRow';
import { UserSubscriptions } from './userSubscriptions';

const RoleSelect = bindComponent(MultiSelectField);

const paths = {
  list: '/users',
  edit: (id: string) => `/users/edit/${id}`,
};

const userData = {
  title: 'userCreateOrEditView.userDataTitle',
  fields: [
    'image',
    ['firstName', 'name'],
    ['email', 'birthday'],
    'flair',
    'note',
  ],
} as const;

const address = {
  title: 'userCreateOrEditView.addressTitle',
  fields: [
    'address.company',
    ['address.streetAddress', 'address.streetAddressNumber'],
    ['address.streetAddress2', 'address.streetAddress2Number'],
    ['address.zipCode', 'address.city'],
    'address.country',
  ],
} as const;

const properties = {
  title: 'userCreateOrEditView.properties',
  description: 'userCreateOrEditView.propertiesInfo',
  fields: ['properties'],
} as const;

const roles = {
  title: 'userCreateOrEditView.userRoles',
  description: 'userCreateOrEditView.userRolesInfo',
  placement: 'aside',
  fields: ['roleIds'],
} as const;

const fields = {
  image: { hideLabel: true },
  'address.country': { props: { searchable: true } },
  properties: { props: { addLabel: 'userCreateOrEditView.addProperty' } },
  'properties.*': { layout: UserPropertyRow },
  roleIds: { hideLabel: true, component: RoleSelect },
} as const;

export const createUserView = formView(userCreateSchema, {
  paths,
  sections: [
    userData,
    address,
    properties,
    {
      title: 'userCreateOrEditView.passwordHeader',
      placement: 'aside',
      fields: ['active', 'password'],
    },
    roles,
  ],
  fields: {
    ...fields,
    password: { props: { type: 'password', autoComplete: 'new-password' } },
  },
});

export const editUserView = formView(userSchema, {
  paths,
  sections: [
    userData,
    address,
    properties,
    {
      title: 'userCreateOrEditView.subscriptionsHeader',
      component: UserSubscriptions,
    },
    { title: 'userMail.title', component: UserMails },
    {
      title: 'userCreateOrEditView.passwordHeader',
      placement: 'aside',
      fields: ['active'],
      component: UserAccessActions,
    },
    roles,
  ],
  fields,
});
