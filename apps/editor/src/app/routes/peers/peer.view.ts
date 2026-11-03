import { bindComponent, formView, SecretField } from '@wepublish/form/editor';
import { slugify } from '@wepublish/utils';

import { peerCreateSchema, peerEditSchema } from './peer.schema';
import { RemotePeerProfile } from './remotePeerProfile';

export const peerRoutes = {
  list: '/peering',
  create: '/peering/create',
  edit: '/peering/edit/:id',
  profile: '/peering/profile/edit',
} as const;

const paths = {
  list: peerRoutes.list,
  edit: (id: string) => `/peering/edit/${id}`,
};

const secretInput = bindComponent(SecretField);

const slugFromName = (
  name: string,
  { setValue }: { setValue: (path: 'slug', value: string) => void }
) => setValue('slug', slugify(name));

const sections = [
  { fields: ['name', 'slug', 'information'] },
  { title: 'peerList.panels.connection', fields: ['hostURL', 'token'] },
  { title: 'peerList.panels.remoteProfile', component: RemotePeerProfile },
] as const;

const fields = {
  name: { onValueChange: slugFromName },
  slug: { hidden: true },
} as const;

export const peerCreateView = formView(peerCreateSchema, {
  paths,
  sections,
  fields: { ...fields, token: { component: secretInput } },
});

export const peerEditView = formView(peerEditSchema, {
  paths,
  sections,
  fields,
});
