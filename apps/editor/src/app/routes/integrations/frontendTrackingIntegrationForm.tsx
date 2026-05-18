import {
  FrontendTrackingProviderType,
  SettingFrontendTracking,
  SettingsIntegrationsFrontendTrackingDocument,
  UpdateFrontendTrackingSettingDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import ga4Logo from './assets/ga4.svg';
import gtmLogo from './assets/gtm.svg';
import piwikProLogo from './assets/piwikPro.svg';
import plausibleLogo from './assets/plausible.svg';
import { FieldDefinition } from './genericIntegrationForm';
import { GenericIntegrationList } from './genericIntegrationList';

const logoByType: Record<FrontendTrackingProviderType, string> = {
  [FrontendTrackingProviderType.GoogleAnalytics_4]: ga4Logo,
  [FrontendTrackingProviderType.GoogleTagManager]: gtmLogo,
  [FrontendTrackingProviderType.Plausible]: plausibleLogo,
  [FrontendTrackingProviderType.PiwikPro]: piwikProLogo,
};

const frontendTrackingSchema = z.object({
  name: z.string().nullish(),
  active: z.boolean().nullish(),
  ga4_measurementId: z.string().nullish().or(z.literal('')),
  gtm_containerId: z.string().nullish().or(z.literal('')),
  plausible_siteId: z.string().nullish().or(z.literal('')),
  plausible_scriptUrl: z.string().url().nullish().or(z.literal('')),
  piwik_containerId: z.string().nullish().or(z.literal('')),
  piwik_subdomain: z.string().nullish().or(z.literal('')),
});

type IntegrationFormValues = z.infer<typeof frontendTrackingSchema>;

export function FrontendTrackingIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingFrontendTracking, IntegrationFormValues>
      query={SettingsIntegrationsFrontendTrackingDocument}
      mutation={UpdateFrontendTrackingSettingDocument}
      dataKey="frontendTrackingSettings"
      schema={frontendTrackingSchema}
      getLogo={setting => logoByType[setting.type]}
      fields={(setting: SettingFrontendTracking) => {
        const base: FieldDefinition<IntegrationFormValues>[] = [
          {
            name: 'name',
            label: t('integrations.frontendTrackingSettings.name'),
            type: 'text',
            placeholder: t(
              'integrations.frontendTrackingSettings.namePlaceholder'
            ),
          },
          {
            name: 'active',
            label: t('integrations.frontendTrackingSettings.active'),
            type: 'checkbox',
          },
        ];

        switch (setting.type) {
          case FrontendTrackingProviderType.GoogleAnalytics_4:
            return [
              ...base,
              {
                name: 'ga4_measurementId',
                label: t(
                  'integrations.frontendTrackingSettings.ga4.measurementId'
                ),
                type: 'text',
                placeholder: 'G-XXXXXXXXXX',
                autoComplete: 'one-time-code',
              },
            ];
          case FrontendTrackingProviderType.GoogleTagManager:
            return [
              ...base,
              {
                name: 'gtm_containerId',
                label: t(
                  'integrations.frontendTrackingSettings.gtm.containerId'
                ),
                type: 'text',
                placeholder: 'GTM-XXXXXXX',
                autoComplete: 'one-time-code',
              },
            ];
          case FrontendTrackingProviderType.Plausible:
            return [
              ...base,
              {
                name: 'plausible_siteId',
                label: t(
                  'integrations.frontendTrackingSettings.plausible.siteId'
                ),
                type: 'text',
                placeholder: 'example.com',
                autoComplete: 'one-time-code',
              },
              {
                name: 'plausible_scriptUrl',
                label: t(
                  'integrations.frontendTrackingSettings.plausible.scriptUrl'
                ),
                type: 'text',
                placeholder: 'https://plausible.io/js/script.js',
                autoComplete: 'one-time-code',
              },
            ];
          case FrontendTrackingProviderType.PiwikPro:
            return [
              ...base,
              {
                name: 'piwik_subdomain',
                label: t(
                  'integrations.frontendTrackingSettings.piwik.subdomain'
                ),
                type: 'text',
                placeholder: 'example',
                autoComplete: 'one-time-code',
              },
              {
                name: 'piwik_containerId',
                label: t(
                  'integrations.frontendTrackingSettings.piwik.containerId'
                ),
                type: 'text',
                placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (UUID)',
                autoComplete: 'one-time-code',
              },
            ];
          default:
            return base;
        }
      }}
    />
  );
}
