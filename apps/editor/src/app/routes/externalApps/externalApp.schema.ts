import {
  type CreateExternalAppMutationVariables,
  type ExternalAppFragment,
  ExternalAppsTarget,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const externalAppSchema = z.object({
  name: z.string().min(1).meta({ label: 'externalAppForm.name' }),
  description: formFields
    .textarea()
    .meta({ label: 'externalAppForm.description' }),
  target: z.enum(ExternalAppsTarget).default(ExternalAppsTarget.Blank).meta({
    label: 'externalAppForm.target',
    optionLabelPrefix: 'externalAppForm.targets.',
  }),
  url: z.url().meta({ label: 'externalAppForm.url' }),
  icon: z.string().meta({ label: 'externalAppForm.icon' }),
  apiTokenId: z.string().meta({
    label: 'externalAppForm.apiKey',
    helperText: 'externalAppForm.apiKeyHelp',
  }),
});

export const fromExternalApp = ({
  name,
  description,
  target,
  url,
  icon,
  apiTokenId,
}: ExternalAppFragment): FormDefaultValues<typeof externalAppSchema> => ({
  name,
  description: description ?? '',
  target,
  url,
  icon: icon ?? '',
  apiTokenId: apiTokenId ?? '',
});

type ExternalAppOutput = FormOutput<typeof externalAppSchema>;

export const toExternalAppInput = (
  { name, description, url, target, icon, apiTokenId }: ExternalAppOutput,
  linkApiKey: boolean
): CreateExternalAppMutationVariables['input'] => ({
  name,
  description,
  url,
  target,
  icon,
  ...(linkApiKey ? { apiTokenId: apiTokenId || null } : {}),
});
