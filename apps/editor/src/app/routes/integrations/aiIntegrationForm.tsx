import {
  SettingAiProvider,
  SettingsIntegrationsAiDocument,
  UpdateSettingsIntegrationsAiDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import vercelLogo from './assets/vercel.svg';
import { GenericIntegrationList } from './genericIntegrationList';

const aiSettingsSchema = z.object({
  apiKey: z.string().nullish().or(z.literal('')),
  systemPrompt: z.string().nullish().or(z.literal('')),
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
      getLogo={() => vercelLogo}
      fields={[
        {
          name: 'apiKey',
          label: t('integrations.aiSettings.apiKey'),
          type: 'password',
          autoComplete: 'one-time-code',
        },
        {
          name: 'systemPrompt',
          label: t('integrations.aiSettings.systemPrompt'),
          type: 'textarea',
          rows: 5,
        },
      ]}
    />
  );
}
