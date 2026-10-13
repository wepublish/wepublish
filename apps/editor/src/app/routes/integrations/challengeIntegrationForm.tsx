import {
  ChallengeProviderType,
  CreateSettingsIntegrationsChallengeDocument,
  SettingChallengeProvider,
  SettingsIntegrationsChallengeDocument,
  UpdateSettingsIntegrationsChallengeDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import cloudflareLogo from './assets/cloudflare.svg';
import hcaptchaLogo from './assets/hcaptcha.webp';
import { GenericIntegrationList } from './genericIntegrationList';

const challengeSettingsSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  type: z.nativeEnum(ChallengeProviderType).nullish(),
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
      setup={{
        createMutation: CreateSettingsIntegrationsChallengeDocument,
        types: Object.values(ChallengeProviderType).map(type => ({
          label: type,
          value: type,
        })),
      }}
      schema={challengeSettingsSchema}
      getLogo={setting =>
        setting.type === ChallengeProviderType.Hcaptcha ?
          hcaptchaLogo
        : cloudflareLogo
      }
      fields={[
        {
          name: 'type',
          label: t('integrations.challengeSettings.type'),
          info: t('integrations.challengeSettings.typeInfo'),
          type: 'select',
          options: Object.values(ChallengeProviderType).map(v => ({
            label: v,
            value: v,
          })),
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
          info: t('integrations.challengeSettings.siteKeyInfo'),
          placeholder: t('integrations.placeholderSecret'),
          autoComplete: 'one-time-code',
        },
        {
          name: 'secret',
          label: t('integrations.challengeSettings.secret'),
          info: t('integrations.challengeSettings.secretInfo'),
          type: 'password',
          placeholder: t('integrations.placeholderSecret'),
          autoComplete: 'one-time-code',
        },
      ]}
    />
  );
}
