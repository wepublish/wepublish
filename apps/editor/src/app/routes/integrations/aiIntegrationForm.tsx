import {
  AiProviderType,
  CreateAiSettingDocument,
  SettingAiProvider,
  SettingsIntegrationsAiDocument,
  UpdateSettingsIntegrationsAiDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { GenericIntegrationList } from './genericIntegrationList';
import { providersOf } from './integrationCatalog';
import { secretPlaceholder } from './secretPlaceholder';

const aiSettingsSchema = z.object({
  apiKey: z.string().nullish().or(z.literal('')),
  systemPrompt: z.string().nullish().or(z.literal('')),
});

type IntegrationFormValues = z.infer<typeof aiSettingsSchema>;

export function AIIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingAiProvider, IntegrationFormValues>
      integrationKey="ai"
      providers={providersOf('ai', t)}
      query={SettingsIntegrationsAiDocument}
      mutation={UpdateSettingsIntegrationsAiDocument}
      dataKey="aiSettings"
      schema={aiSettingsSchema}
      fixedProvider={{
        id: 'v0',
        type: AiProviderType.V0,
        name: 'V0',
        createMutation: CreateAiSettingDocument,
      }}
      fields={setting => [
        {
          name: 'apiKey',
          label: t('integrations.aiSettings.apiKey'),
          info: t('integrations.aiSettings.apiKeyInfo'),
          type: 'password',
          autoComplete: 'one-time-code',
          placeholder: secretPlaceholder(setting.isApiKeySet, t),
        },
        {
          name: 'systemPrompt',
          label: t('integrations.aiSettings.systemPrompt'),
          info: t('integrations.aiSettings.systemPromptInfo'),
          type: 'textarea',
          rows: 5,
        },
      ]}
    />
  );
}
