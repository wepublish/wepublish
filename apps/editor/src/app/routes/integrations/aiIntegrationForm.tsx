import {
  SettingAiProvider,
  SettingsIntegrationsAiDocument,
  UpdateSettingsIntegrationsAiDocument,
} from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { GenericIntegrationList } from './genericIntegrationList';
import vercelLogo from '../../../assets/integrations/vercel.svg';

const aiSettingsSchema = z.object({
  id: z.string(),
  apiKey: z.string().optional(),
  systemPrompt: z.string().optional(),
});

type IntegrationFormValues = z.infer<typeof aiSettingsSchema>;

export function AIIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingAiProvider, IntegrationFormValues>
      query={SettingsIntegrationsAiDocument}
      mutation={UpdateSettingsIntegrationsAiDocument}
      dataKey="aiSettings"
      schema={aiSettingsSchema}
      mapSettingToInitialValues={setting => ({
        id: setting.id,
        // apiKey is sensitive and not returned, assume empty/undefined
        apiKey: undefined,
        // systemPrompt is in the GQL type
        systemPrompt: setting.systemPrompt || '',
      })}
      mapFormValuesToVariables={(formData, setting) => ({
        updateAiSettingId: setting.id,
        apiKey: formData.apiKey,
        systemPrompt: formData.systemPrompt,
      })}
      getLogo={() => vercelLogo}
      fields={[
        {
          name: 'apiKey',
          label: t('integrations.aiSettings.apiKey'),
          type: 'password',
          autoComplete: 'off',
        },
        {
          name: 'systemPrompt',
          label: t('integrations.aiSettings.systemPrompt'),
          type: 'textarea',
          textareaRows: 5,
        },
      ]}
    />
  );
}
