import type {
  SettingAnalyticsCredentialsInput,
  SettingsIntegrationsAnalyticsQuery,
} from '@wepublish/editor/api';
import type { FormDefaultValues } from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const analyticsCredentialsSchema = z.object({
  type: z.string(),
  project_id: z.string(),
  private_key_id: z.string(),
  private_key: z.string(),
  client_email: z.string(),
  client_id: z.string(),
});

export const analyticsSettingSchema = z.object({
  articlePrefix: z.string().nullish().meta({
    label: 'integrations.analyticsSettings.articlePrefix',
    description: 'integrations.analyticsSettings.articlePrefixInfo',
  }),
  property: z.string().nullish().meta({
    label: 'integrations.analyticsSettings.property',
    description: 'integrations.analyticsSettings.propertyInfo',
  }),
  credentials: z
    .custom<SettingAnalyticsCredentialsInput>()
    .nullish()
    .transform(credentials => credentials ?? undefined)
    .meta({
      label: 'integrations.analyticsSettings.credentials',
      description: 'integrations.analyticsSettings.credentialsInfo',
    }),
});

export type AnalyticsSetting =
  SettingsIntegrationsAnalyticsQuery['analyticsProviderSettings'][number];

export const fromAnalyticsSetting = ({
  articlePrefix,
  property,
}: AnalyticsSetting): FormDefaultValues<typeof analyticsSettingSchema> => ({
  articlePrefix,
  property,
});
