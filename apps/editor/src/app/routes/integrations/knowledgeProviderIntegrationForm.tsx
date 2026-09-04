import {
  SettingKnowledgeProvider,
  SettingsIntegrationsKnowledgeProviderDocument,
  UpdateSettingsIntegrationsKnowledgeProviderDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { GenericIntegrationList } from './genericIntegrationList';

const knowledgeProviderSchema = z.object({
  url: z.string().nullish().or(z.literal('')),
  token: z.string().nullish().or(z.literal('')),
  tenant: z.string().nullish().or(z.literal('')),
  enabled: z.boolean().nullish(),
});

type IntegrationFormValues = z.infer<typeof knowledgeProviderSchema>;

export function KnowledgeProviderIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingKnowledgeProvider, IntegrationFormValues>
      query={SettingsIntegrationsKnowledgeProviderDocument}
      mutation={UpdateSettingsIntegrationsKnowledgeProviderDocument}
      dataKey="knowledgeProviderSettings"
      schema={knowledgeProviderSchema}
      fields={[
        {
          name: 'url',
          label: t('integrations.knowledgeProviderSettings.url'),
          type: 'text',
          placeholder: 'https://zettelkasten.example',
        },
        {
          name: 'tenant',
          label: t('integrations.knowledgeProviderSettings.tenant'),
          type: 'text',
        },
        {
          name: 'token',
          label: t('integrations.knowledgeProviderSettings.token'),
          type: 'password',
          autoComplete: 'one-time-code',
        },
        {
          name: 'enabled',
          label: t('integrations.knowledgeProviderSettings.enabled'),
          type: 'checkbox',
        },
      ]}
    />
  );
}
