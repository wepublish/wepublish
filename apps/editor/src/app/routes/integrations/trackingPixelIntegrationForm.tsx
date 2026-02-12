import {
  SettingTrackingPixel,
  TrackingPixelProviderType,
  TrackingPixelSettingsDocument,
  UpdateTrackingPixelSettingDocument,
} from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import proLitterisLogo from '../../../assets/integrations/proLitteris.svg';
import { FieldDefinition } from './genericIntegrationForm';
import { GenericIntegrationList } from './genericIntegrationList';

const trackingPixelSettingsSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.nativeEnum(TrackingPixelProviderType).optional(),

  prolitterisMemberNr: z.string().optional(),
  prolitterisOnlyPaidContentAccess: z.boolean().optional(),
  prolitterisPassword: z.string().optional(),
  prolitterisPublisherInternalKeyDomain: z.string().optional(),
  prolitterisUsePublisherInternalKey: z.boolean().optional(),
  prolitterisUsername: z.string().optional(),
});

type IntegrationFormValues = z.infer<typeof trackingPixelSettingsSchema>;

export function TrackingPixelIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingTrackingPixel, IntegrationFormValues>
      query={TrackingPixelSettingsDocument}
      mutation={UpdateTrackingPixelSettingDocument}
      dataKey="trackingPixelSettings"
      schema={trackingPixelSettingsSchema}
      mapSettingToInitialValues={setting => ({
        id: setting.id,
        name: setting.name || undefined,
        type: setting.type,
        prolitterisMemberNr: setting.prolitteris_memberNr || undefined,
        prolitterisOnlyPaidContentAccess:
          setting.prolitteris_onlyPaidContentAccess || false,
        prolitterisPassword: undefined,
        prolitterisPublisherInternalKeyDomain:
          setting.prolitteris_publisherInternalKeyDomain || undefined,
        prolitterisUsePublisherInternalKey:
          setting.prolitteris_usePublisherInternalKey || false,
        prolitterisUsername: setting.prolitteris_username || undefined,
      })}
      mapFormValuesToVariables={(formData, setting) => ({
        updateTrackingPixelSettingId: setting.id,
        name: formData.name,
        prolitterisMemberNr: formData.prolitterisMemberNr,
        prolitterisOnlyPaidContentAccess:
          formData.prolitterisOnlyPaidContentAccess,
        prolitterisPassword: formData.prolitterisPassword,
        prolitterisPublisherInternalKeyDomain:
          formData.prolitterisPublisherInternalKeyDomain,
        prolitterisUsePublisherInternalKey:
          formData.prolitterisUsePublisherInternalKey,
        prolitterisUsername: formData.prolitterisUsername,
      })}
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
            name: 'name',
            label: t('name'),
          },
        ];

        if (setting.type === TrackingPixelProviderType.Prolitteris) {
          commonFields.push({
            name: 'prolitterisMemberNr',
            label: t('integrations.trackingPixelSettings.prolitterisMemberNr'),
          });
          commonFields.push({
            name: 'prolitterisUsername',
            label: t('integrations.trackingPixelSettings.prolitterisUsername'),
          });
          commonFields.push({
            name: 'prolitterisPassword',
            label: t('integrations.trackingPixelSettings.prolitterisPassword'),
            type: 'password',
            autoComplete: 'off',
          });
          commonFields.push({
            name: 'prolitterisOnlyPaidContentAccess',
            label: t(
              'integrations.trackingPixelSettings.prolitterisOnlyPaidContentAccess'
            ),
            type: 'checkbox',
          });
          commonFields.push({
            name: 'prolitterisUsePublisherInternalKey',
            label: t(
              'integrations.trackingPixelSettings.prolitterisUsePublisherInternalKey'
            ),
            type: 'checkbox',
          });
          commonFields.push({
            name: 'prolitterisPublisherInternalKeyDomain',
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
