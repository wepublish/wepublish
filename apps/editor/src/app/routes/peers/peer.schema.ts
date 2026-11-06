import type {
  CreatePeerMutationVariables,
  FullPeerFragment,
  UpdatePeerMutationVariables,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const peerCreateSchema = z.object({
  name: z.string().min(1).meta({ label: 'peerList.panels.name' }),
  slug: z.string(),
  information: formFields
    .richText()
    .nullish()
    .meta({ label: 'peerList.panels.information' }),
  hostURL: z.url().meta({
    label: 'peerList.overview.hostURL',
    description: 'peerList.panels.urlInfo',
  }),
  token: z.string().min(1).meta({
    label: 'peerList.panels.token',
    description: 'peerList.panels.tokenInfo',
  }),
});

export const peerEditSchema = peerCreateSchema.extend({
  token: formFields.secret().meta({
    label: 'peerList.panels.token',
    description: 'peerList.panels.tokenInfo',
    helperText: 'peerList.panels.leaveEmpty',
  }),
});

export const fromPeer = ({
  name,
  slug,
  information,
  hostURL,
}: FullPeerFragment): FormDefaultValues<typeof peerEditSchema> => ({
  name,
  slug,
  information,
  hostURL,
});

export const toCreatePeerVariables = ({
  name,
  slug,
  information,
  hostURL,
  token,
}: FormOutput<typeof peerCreateSchema>): CreatePeerMutationVariables => ({
  name,
  slug,
  hostURL: new URL(hostURL).toString(),
  token,
  information: information ?? null,
});

export const toUpdatePeerVariables = (
  id: string,
  { name, slug, information, hostURL, token }: FormOutput<typeof peerEditSchema>
): UpdatePeerMutationVariables => ({
  id,
  name,
  slug,
  hostURL: new URL(hostURL).toString(),
  token,
  information: information ?? null,
});
