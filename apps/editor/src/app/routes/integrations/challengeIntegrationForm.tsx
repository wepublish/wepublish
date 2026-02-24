import {
  ChallengeProviderType,
  SettingChallengeProvider,
  SettingsIntegrationsChallengeDocument,
  UpdateSettingsIntegrationsChallengeDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import cloudflareLogo from './assets/cloudflare.svg';
import { GenericIntegrationList } from './genericIntegrationList';

const challengeSettingsSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  type: z.nativeEnum(ChallengeProviderType).optional(),
  secret: z.string().nullish().or(z.literal('')),
  siteKey: z.string().nullish().or(z.literal('')),
});

type IntegrationFormValues = z.infer<typeof challengeSettingsSchema>;

export function ChallengeIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingChallengeProvider, IntegrationFormValues>
      query={SettingsIntegrationsChallengeDocument}
      mutation={UpdateSettingsIntegrationsChallengeDocument}
      dataKey="challengeProviderSettings"
      schema={challengeSettingsSchema}
      getLogo={() => cloudflareLogo}
      fields={[
        {
          name: 'type',
          label: t('integrations.challengeSettings.type'),
          type: 'select',
          options: Object.values(ChallengeProviderType).map(v => ({
            label: v,
            value: v,
          })),
          disabled: true,
        },
        {
          type: 'text',
          name: 'name',
          label: t('name'),
        },
        {
          type: 'text',
          name: 'siteKey',
          label: t('integrations.challengeSettings.siteKey'),
          placeholder: t('integrations.placeholderSecret'),
          autoComplete: 'one-time-code',
        },
        {
          name: 'secret',
          label: t('integrations.challengeSettings.secret'),
          type: 'password',
          placeholder: t('integrations.placeholderSecret'),
          autoComplete: 'one-time-code',
        },
      ]}
    />
  );
}
