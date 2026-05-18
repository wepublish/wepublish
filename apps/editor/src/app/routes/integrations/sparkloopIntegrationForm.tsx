import {
  UpdateSparkloopSettingsDocument,
  useSettingsIntegrationsSparkloopQuery,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { Loader, Message } from 'rsuite';
import { z } from 'zod';

import { SingleGenericIntegrationForm } from './genericIntegrationForm';

const sparkloopSchema = z.object({
  name: z.string().nullish(),
  active: z.boolean().nullish(),
  teamId: z.string().nullish().or(z.literal('')),
});

type IntegrationFormValues = z.infer<typeof sparkloopSchema>;

export function SparkloopIntegrationForm() {
  const { t } = useTranslation();
  const { data, loading, error } = useSettingsIntegrationsSparkloopQuery();

  if (loading) {
    return <Loader center />;
  }

  if (error) {
    return <Message type="error">{error.message}</Message>;
  }

  const setting = data?.sparkloopSettings;

  if (!setting) {
    return (
      <Message type="warning">{t('integrations.noSettingsFound')}</Message>
    );
  }

  return (
    <SingleGenericIntegrationForm<typeof setting, IntegrationFormValues>
      setting={setting}
      mutation={UpdateSparkloopSettingsDocument}
      schema={sparkloopSchema}
      fields={[
        {
          name: 'name',
          label: t('name'),
          type: 'text',
        },
        {
          name: 'active',
          label: t('integrations.sparkloopSettings.active'),
          type: 'checkbox',
        },
        {
          name: 'teamId',
          label: t('integrations.sparkloopSettings.teamId'),
          type: 'text',
          autoComplete: 'one-time-code',
        },
      ]}
    />
  );
}
