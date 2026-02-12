import {
  ChallengeProviderType,
  SettingChallengeProvider,
  SettingsIntegrationsChallengeDocument,
  UpdateSettingsIntegrationsChallengeDocument,
} from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import cloudflareLogo from '../../../assets/integrations/cloudflare.svg';
import { GenericIntegrationList } from './genericIntegrationList';

const challengeSettingsSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.nativeEnum(ChallengeProviderType).optional(),
  secret: z.string().optional(),
  siteKey: z.string().optional(),
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
      mapSettingToInitialValues={setting => ({
        id: setting.id,
        name: setting.name || '',
        type: setting.type,
        secret: undefined,
        siteKey: undefined,
      })}
      mapFormValuesToVariables={(formData, setting) => ({
        updateChallengeProviderSettingId: setting.id,
        name: formData.name,
        secret: formData.secret || undefined,
        siteKey: formData.siteKey || undefined,
      })}
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
          name: 'name',
          label: t('name'),
        },
        {
          name: 'secret',
          label: t('integrations.challengeSettings.secret'),
          type: 'password',
          placeholder: t('integrations.placeholderSecret'),
          autoComplete: 'off',
        },
        {
          name: 'siteKey',
          label: t('integrations.challengeSettings.siteKey'),
          placeholder: t('integrations.placeholderSecret'),
        },
      ]}
    />
  );
}
