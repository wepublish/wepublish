import {
  CreateTrackingPixelSettingDocument,
  DeleteTrackingPixelSettingDocument,
  SettingTrackingPixelProvider,
  TrackingPixelProviderType,
  TrackingPixelSettingsDocument,
  UpdateTrackingPixelSettingDocument,
} from '@wepublish/editor/api';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import proLitterisLogo from './assets/proLitteris.svg';
import { FieldDefinition } from './genericIntegrationForm';
import { GenericIntegrationList } from './genericIntegrationList';

// The stored password is never sent to the editor and an empty one keeps it,
// so only the fields the provider cannot work without are required.
export const createTrackingPixelSettingsSchema = (t: (key: string) => string) =>
  z
    .object({
      name: z.string().nullish().or(z.literal('')),
      type: z.nativeEnum(TrackingPixelProviderType).nullish(),

      prolitteris_memberNr: z.string().nullish().or(z.literal('')),
      prolitteris_onlyPaidContentAccess: z.boolean().nullish(),
      prolitteris_password: z.string().nullish().or(z.literal('')),
      prolitteris_publisherInternalKeyDomain: z
        .string()
        .nullish()
        .or(z.literal('')),
      prolitteris_usePublisherInternalKey: z.boolean().nullish(),
      prolitteris_username: z.string().nullish().or(z.literal('')),
    })
    .superRefine((values, ctx) => {
      if (values.type !== TrackingPixelProviderType.Prolitteris) {
        return;
      }

      const required: (keyof typeof values)[] = [
        'prolitteris_memberNr',
        values.prolitteris_usePublisherInternalKey ?
          'prolitteris_publisherInternalKeyDomain'
        : 'prolitteris_username',
      ];

      for (const field of required) {
        if (!values[field]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: t('errorMessages.required'),
          });
        }
      }
    });

type IntegrationFormValues = z.infer<
  ReturnType<typeof createTrackingPixelSettingsSchema>
>;

export function TrackingPixelIntegrationForm() {
  const { t } = useTranslation();
  const schema = useMemo(() => createTrackingPixelSettingsSchema(t), [t]);

  return (
    <GenericIntegrationList<SettingTrackingPixelProvider, IntegrationFormValues>
      query={TrackingPixelSettingsDocument}
      mutation={UpdateTrackingPixelSettingDocument}
      dataKey="trackingPixelSettings"
      schema={schema}
      registry={{
        createMutation: CreateTrackingPixelSettingDocument,
        deleteMutation: DeleteTrackingPixelSettingDocument,
        types: Object.values(TrackingPixelProviderType).map(value => ({
          label: value,
          value,
        })),
      }}
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
            info: t(
              'integrations.trackingPixelSettings.prolitterisMemberNrInfo'
            ),
          });
          commonFields.push({
            type: 'text',
            name: 'prolitteris_username',
            label: t('integrations.trackingPixelSettings.prolitterisUsername'),
            info: t('integrations.trackingPixelSettings.prolitterisLoginInfo'),
          });
          commonFields.push({
            name: 'prolitteris_password',
            label: t('integrations.trackingPixelSettings.prolitterisPassword'),
            info: t('integrations.trackingPixelSettings.prolitterisLoginInfo'),
            type: 'password',
            autoComplete: 'one-time-code',
          });
          commonFields.push({
            name: 'prolitteris_onlyPaidContentAccess',
            label: t(
              'integrations.trackingPixelSettings.prolitterisOnlyPaidContentAccess'
            ),
            info: t(
              'integrations.trackingPixelSettings.prolitterisOnlyPaidContentAccessInfo'
            ),
            type: 'checkbox',
          });
          commonFields.push({
            name: 'prolitteris_usePublisherInternalKey',
            label: t(
              'integrations.trackingPixelSettings.prolitterisUsePublisherInternalKey'
            ),
            info: t(
              'integrations.trackingPixelSettings.prolitterisUsePublisherInternalKeyInfo'
            ),
            type: 'checkbox',
          });
          commonFields.push({
            type: 'text',
            name: 'prolitteris_publisherInternalKeyDomain',
            label: t(
              'integrations.trackingPixelSettings.prolitterisPublisherInternalKeyDomain'
            ),
            info: t(
              'integrations.trackingPixelSettings.prolitterisPublisherInternalKeyDomainInfo'
            ),
          });
        }

        return commonFields;
      }}
    />
  );
}
