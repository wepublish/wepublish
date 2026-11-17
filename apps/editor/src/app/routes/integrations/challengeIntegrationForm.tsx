import {
  ChallengeProviderType,
  CreateSettingsIntegrationsChallengeDocument,
  SettingChallengeProvider,
  SettingsIntegrationsChallengeDocument,
  UpdateSettingsIntegrationsChallengeDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { GenericIntegrationList } from './genericIntegrationList';
import { providersOf, typeOptionsOf } from './integrationCatalog';
import { secretPlaceholder } from './secretPlaceholder';

const challengeSettingsSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  type: z.nativeEnum(ChallengeProviderType).nullish(),
  secret: z.string().nullish().or(z.literal('')),
  siteKey: z.string().nullish().or(z.literal('')),
});

type IntegrationFormValues = z.infer<typeof challengeSettingsSchema>;

export function ChallengeIntegrationForm() {
  const { t } = useTranslation();
  const providers = providersOf('challenge', t);

  return (
    <GenericIntegrationList<SettingChallengeProvider, IntegrationFormValues>
      integrationKey="challenge"
      providers={providers}
      query={SettingsIntegrationsChallengeDocument}
      mutation={UpdateSettingsIntegrationsChallengeDocument}
      dataKey="challengeProviderSettings"
      setup={{
        createMutation: CreateSettingsIntegrationsChallengeDocument,
        types: typeOptionsOf(providers),
      }}
      schema={challengeSettingsSchema}
      fields={setting => [
        {
          name: 'type',
          half: true,
          label: t('integrations.challengeSettings.type'),
          info: t('integrations.challengeSettings.typeInfo'),
          type: 'select',
          options: typeOptionsOf(providers),
        },
        {
          type: 'text',
          name: 'name',
          half: true,
          label: t('name'),
        },
        {
          type: 'text',
          name: 'siteKey',
          label: t('integrations.challengeSettings.siteKey'),
          info: t('integrations.challengeSettings.siteKeyInfo'),
          placeholder: t('integrations.placeholderSecret'),
          autoComplete: 'one-time-code',
        },
        {
          name: 'secret',
          label: t('integrations.challengeSettings.secret'),
          info: t('integrations.challengeSettings.secretInfo'),
          type: 'password',
          placeholder: secretPlaceholder(setting.isSecretSet, t),
          autoComplete: 'one-time-code',
        },
      ]}
    />
  );
}
