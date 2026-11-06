import type {
  FullPeerProfileFragment,
  UpdatePeerProfileMutationVariables,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const peerProfileSchema = z.object({
  name: z.string().min(1).meta({ label: 'peerList.panels.name' }),
  logo: formFields.image().meta({ label: 'peerList.panels.logo' }),
  squareLogo: formFields.image().meta({ label: 'peerList.panels.squareLogo' }),
  themeColor: formFields.color({ alpha: false }).meta({
    label: 'peerList.panels.themeColor',
    description: 'peerList.panels.themeColorInfo',
  }),
  themeFontColor: formFields.color({ alpha: false }).meta({
    label: 'peerList.panels.themeFontColor',
  }),
  callToActionText: formFields.richText().meta({
    label: 'peerList.panels.text',
  }),
  callToActionURL: z.url().meta({ label: 'peerList.panels.callToActionURL' }),
  callToActionImage: formFields.image().meta({
    label: 'peerList.panels.image',
  }),
  callToActionImageURL: z.url().meta({
    label: 'peerList.panels.callToActionImageURL',
  }),
});

export const fromPeerProfile = (
  profile: FullPeerProfileFragment
): FormDefaultValues<typeof peerProfileSchema> => ({
  name: profile.name,
  logo: profile.logo,
  squareLogo: profile.squareLogo,
  themeColor: profile.themeColor,
  themeFontColor: profile.themeFontColor,
  callToActionText: profile.callToActionText,
  callToActionURL: profile.callToActionURL,
  callToActionImage: profile.callToActionImage,
  callToActionImageURL: profile.callToActionImageURL ?? '',
});

export const toPeerProfileVariables = ({
  name,
  logo,
  squareLogo,
  themeColor,
  themeFontColor,
  callToActionText,
  callToActionURL,
  callToActionImage,
  callToActionImageURL,
}: FormOutput<
  typeof peerProfileSchema
>): UpdatePeerProfileMutationVariables => ({
  name,
  logoID: logo.id,
  squareLogoId: squareLogo.id,
  themeColor,
  themeFontColor,
  callToActionText,
  callToActionURL,
  callToActionImageID: callToActionImage.id,
  callToActionImageURL,
});
