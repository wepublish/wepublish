import {
  CreateLetterProviderSettingDocument,
  DeleteLetterProviderSettingDocument,
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  LetterProviderEnvironment,
  LetterProviderSettingsDocument,
  LetterProviderType,
  SettingLetterProvider,
  UpdateLetterProviderSettingDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { FieldDefinition } from './genericIntegrationForm';
import { GenericIntegrationList } from './genericIntegrationList';

const letterSettingsSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  type: z.nativeEnum(LetterProviderType).nullish(),
  environment: z.nativeEnum(LetterProviderEnvironment).nullish(),

  clientId: z.string().nullish().or(z.literal('')),
  clientSecret: z.string().nullish().or(z.literal('')),
  organisationId: z.string().nullish().or(z.literal('')),
  webhookSigningKey: z.string().nullish().or(z.literal('')),

  autoSend: z.boolean().nullish(),
  placeholderEmailContains: z.string().nullish().or(z.literal('')),

  defaultAddressPosition: z.nativeEnum(LetterAddressPosition).nullish(),
  defaultDeliveryProduct: z.nativeEnum(LetterDeliveryProduct).nullish(),
  defaultPrintMode: z.nativeEnum(LetterPrintMode).nullish(),
  defaultPrintSpectrum: z.nativeEnum(LetterPrintSpectrum).nullish(),
});

/** The print options of the communication tool, reused as defaults. */
const PRINT_DEFAULTS = [
  ['defaultAddressPosition', 'addressPosition', LetterAddressPosition],
  ['defaultDeliveryProduct', 'deliveryProduct', LetterDeliveryProduct],
  ['defaultPrintMode', 'printMode', LetterPrintMode],
  ['defaultPrintSpectrum', 'printSpectrum', LetterPrintSpectrum],
] as const;

type IntegrationFormValues = z.infer<typeof letterSettingsSchema>;

export function LetterIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingLetterProvider, IntegrationFormValues>
      query={LetterProviderSettingsDocument}
      mutation={UpdateLetterProviderSettingDocument}
      dataKey="letterProviderSettings"
      registry={{
        createMutation: CreateLetterProviderSettingDocument,
        deleteMutation: DeleteLetterProviderSettingDocument,
        types: Object.values(LetterProviderType).map(value => ({
          label: value,
          value,
        })),
      }}
      schema={letterSettingsSchema}
      fields={setting => {
        const commonFields: FieldDefinition<IntegrationFormValues>[] = [
          {
            name: 'type',
            label: t('integrations.letterSettings.type'),
            type: 'select',
            options: Object.values(LetterProviderType).map(v => ({
              label: v,
              value: v,
            })),
          },
          {
            type: 'text',
            name: 'name',
            label: t('name'),
          },
        ];

        if (setting.type === LetterProviderType.Pingen) {
          commonFields.push({
            name: 'environment',
            label: t('integrations.letterSettings.environment'),
            type: 'select',
            options: Object.values(LetterProviderEnvironment).map(v => ({
              label: v,
              value: v,
            })),
          });
          commonFields.push({
            type: 'text',
            name: 'clientId',
            label: t('integrations.letterSettings.clientId'),
          });
          commonFields.push({
            name: 'clientSecret',
            label: t('integrations.letterSettings.clientSecret'),
            type: 'password',
            placeholder: t('integrations.placeholderSecret'),
            autoComplete: 'one-time-code',
          });
          commonFields.push({
            type: 'text',
            name: 'organisationId',
            label: t('integrations.letterSettings.organisationId'),
          });
          commonFields.push({
            name: 'webhookSigningKey',
            label: t('integrations.letterSettings.webhookSigningKey'),
            type: 'password',
            placeholder: t('integrations.placeholderSecret'),
            autoComplete: 'one-time-code',
          });
        }

        commonFields.push({
          type: 'checkbox',
          name: 'autoSend',
          label: t('integrations.letterSettings.autoSend'),
        });

        commonFields.push({
          type: 'text',
          name: 'placeholderEmailContains',
          label: t('integrations.letterSettings.placeholderEmailContains'),
          placeholder: '@placeholder.example.com',
        });

        // Automated letters (subscription mails for users in letter mode) have
        // nobody choosing print options; these stand in.
        for (const [name, option, values] of PRINT_DEFAULTS) {
          commonFields.push({
            name,
            label: t(`integrations.letterSettings.${name}`),
            type: 'select',
            options: Object.values(values).map(value => ({
              label: t(`mailSend.print.${option}.${value}`),
              value,
            })),
          });
        }

        return commonFields;
      }}
    />
  );
}
