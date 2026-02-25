import {
  SettingTrackingPixelProvider,
  TrackingPixelProviderType,
  TrackingPixelSettingsDocument,
  UpdateTrackingPixelSettingDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import proLitterisLogo from './assets/proLitteris.svg';
import { FieldDefinition } from './genericIntegrationForm';
import { GenericIntegrationList } from './genericIntegrationList';

const trackingPixelSettingsSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  type: z.nativeEnum(TrackingPixelProviderType).optional(),

  prolitteris_memberNr: z.string().nullish().or(z.literal('')),
  prolitteris_onlyPaidContentAccess: z.boolean().optional(),
  prolitteris_password: z.string().nullish().or(z.literal('')),
  prolitteris_publisherInternalKeyDomain: z
    .string()
    .optional()
    .or(z.literal('')),
  prolitteris_usePublisherInternalKey: z.boolean().optional(),
  prolitteris_username: z.string().nullish().or(z.literal('')),
});

type IntegrationFormValues = z.infer<typeof trackingPixelSettingsSchema>;

export function TrackingPixelIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingTrackingPixelProvider, IntegrationFormValues>
      query={TrackingPixelSettingsDocument}
      mutation={UpdateTrackingPixelSettingDocument}
      dataKey="trackingPixelSettings"
      schema={trackingPixelSettingsSchema}
      getLogo={setting => {
        switch (setting.type) {
          case TrackingPixelProviderType.Prolitteris:
            return proLitterisLogo;
          default:
            return undefined;
        }
      }}
      fields={setting => {
        const commonFields: FieldDefinition<IntegrationFormValues>[] = [
          {
            name: 'type',
            label: t('integrations.trackingPixelSettings.type'),
            type: 'select',
            options: Object.values(TrackingPixelProviderType).map(v => ({
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
        ];

        if (setting.type === TrackingPixelProviderType.Prolitteris) {
          commonFields.push({
            type: 'text',
            name: 'prolitteris_memberNr',
            label: t('integrations.trackingPixelSettings.prolitterisMemberNr'),
          });
          commonFields.push({
            type: 'text',
            name: 'prolitteris_username',
            label: t('integrations.trackingPixelSettings.prolitterisUsername'),
          });
          commonFields.push({
            name: 'prolitteris_password',
            label: t('integrations.trackingPixelSettings.prolitterisPassword'),
            type: 'password',
            autoComplete: 'one-time-code',
          });
          commonFields.push({
            name: 'prolitteris_onlyPaidContentAccess',
            label: t(
              'integrations.trackingPixelSettings.prolitterisOnlyPaidContentAccess'
            ),
            type: 'checkbox',
          });
          commonFields.push({
            name: 'prolitteris_usePublisherInternalKey',
            label: t(
              'integrations.trackingPixelSettings.prolitterisUsePublisherInternalKey'
            ),
            type: 'checkbox',
          });
          commonFields.push({
            type: 'text',
            name: 'prolitteris_publisherInternalKeyDomain',
            label: t(
              'integrations.trackingPixelSettings.prolitterisPublisherInternalKeyDomain'
            ),
          });
        }

        return commonFields;
      }}
    />
  );
}
