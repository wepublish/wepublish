import {
  type SettingsIntegrationsChallengeQuery,
  ChallengeProviderType,
} from '@wepublish/editor/api';
import { type FormDefaultValues, formFields } from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const challengeSettingSchema = z.object({
  type: z.enum(ChallengeProviderType).meta({
    label: 'integrations.challengeSettings.type',
    description: 'integrations.challengeSettings.typeInfo',
  }),
  name: z.string().nullish().meta({ label: 'name' }),
  siteKey: z
    .string()
    .nullish()
    .transform(siteKey => siteKey || undefined)
    .meta({
      label: 'integrations.challengeSettings.siteKey',
      description: 'integrations.challengeSettings.siteKeyInfo',
      }),
  secret: formFields.secret().meta({
    label: 'integrations.challengeSettings.secret',
    description: 'integrations.challengeSettings.secretInfo',
  }),
});

export type ChallengeSetting =
  SettingsIntegrationsChallengeQuery['challengeProviderSettings'][number];

export const fromChallengeSetting = ({
  type,
  name,
}: ChallengeSetting): FormDefaultValues<typeof challengeSettingSchema> => ({
  type,
  name,
});
