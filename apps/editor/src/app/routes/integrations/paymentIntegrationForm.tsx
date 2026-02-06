import {
  PaymentMethodMollie,
  PaymentProviderSettingsDocument,
  PaymentProviderType,
  PayrexxPm,
  PayrexxPsp,
  SettingPaymentProvider,
  StripePaymentMethod,
  UpdatePaymentProviderSettingDocument,
} from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { GenericIntegrationList } from './genericIntegrationList';
import { FieldDefinition } from './genericIntegrationForm';

const paymentSettingsSchema = z.object({
  // Common
  id: z.string(),
  name: z.string().optional(),
  type: z.nativeEnum(PaymentProviderType).optional(),
  offSessionPayments: z.boolean().optional(),
  apiKey: z.string().optional(),
  webhookEndpointSecret: z.string().optional(),
  // Stripe
  stripe_methods: z.array(z.nativeEnum(StripePaymentMethod)).optional(),
  // Mollie
  mollie_apiBaseUrl: z.string().optional(),
  mollie_methods: z.array(z.nativeEnum(PaymentMethodMollie)).optional(),
  // Payrexx
  payrexx_instancename: z.string().optional(),
  payrexx_vatrate: z.string().optional(),
  payrexx_psp: z.array(z.nativeEnum(PayrexxPsp)).optional(),
  payrexx_pm: z.array(z.nativeEnum(PayrexxPm)).optional(),
});

type IntegrationFormValues = z.infer<typeof paymentSettingsSchema>;

export function PaymentIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingPaymentProvider, IntegrationFormValues>
      query={PaymentProviderSettingsDocument}
      mutation={UpdatePaymentProviderSettingDocument}
      dataKey="paymentProviderSettings"
      schema={paymentSettingsSchema}
      mapSettingToInitialValues={setting => ({
        id: setting.id,
        name: setting.name || undefined,
        type: setting.type,
        offSessionPayments: setting.offSessionPayments ?? undefined,
        stripe_methods: setting.stripe_methods ?? undefined,
        webhookEndpointSecret: undefined,
        mollie_apiBaseUrl: setting.mollie_apiBaseUrl || undefined,
        mollie_methods: setting.mollie_methods ?? undefined,
        apiKey: undefined,
        payrexx_instancename: setting.payrexx_instancename || undefined,
        payrexx_vatrate: setting.payrexx_vatrate || undefined,
        payrexx_psp: setting.payrexx_psp ?? undefined,
        payrexx_pm: setting.payrexx_pm ?? undefined,
      })}
      mapFormValuesToVariables={(formData, setting) => ({
        updatePaymentProviderSettingId: setting.id,
        name: formData.name,
        offSessionPayments: formData.offSessionPayments,
        stripeMethods: formData.stripe_methods,
        webhookEndpointSecret: formData.webhookEndpointSecret,
        mollieApiBaseUrl: formData.mollie_apiBaseUrl,
        mollieMethods: formData.mollie_methods,
        apiKey: formData.apiKey,
        payrexxInstancename: formData.payrexx_instancename,
        payrexxVatrate: formData.payrexx_vatrate,
        payrexxPsp: formData.payrexx_psp,
        payrexxPm: formData.payrexx_pm,
      })}
      fields={setting => {
        const fields: FieldDefinition<IntegrationFormValues>[] = [
          {
            name: 'name',
            label: t('name'),
          },
          {
            name: 'type',
            label: t('integrations.paymentSettings.type'),
            disabled: true,
          },
          {
            name: 'offSessionPayments',
            label: t('integrations.paymentSettings.offSessionPayments'),
            type: 'checkbox',
          },
          {
            name: 'apiKey',
            label: t('integrations.paymentSettings.apiKey'),
            type: 'password',
            autoComplete: 'off',
            placeholder: t('integrations.placeholderSecret'),
          },
          {
            name: 'webhookEndpointSecret',
            label: t('integrations.paymentSettings.webhookEndpointSecret'),
            type: 'password',
            autoComplete: 'off',
            placeholder: t('integrations.placeholderSecret'),
          },
        ];

        if (setting.type === PaymentProviderType.Bexio) {
          // Bexio fields not fully implemented in this example based on schema complexity
          // But adding basic ones or leaving empty if not needed right now
        }

        if (setting.type === PaymentProviderType.Stripe) {
          fields.push({
            name: 'stripe_methods',
            label: t('integrations.paymentSettings.methods'),
            type: 'checkPicker',
            options: Object.values(StripePaymentMethod).map(v => ({
              label: v,
              value: v,
            })),
          });
        }

        if (setting.type === PaymentProviderType.Mollie) {
          fields.push({
            name: 'mollie_apiBaseUrl',
            label: t('integrations.paymentSettings.apiUrl'),
          });
          fields.push({
            name: 'mollie_methods',
            label: t('integrations.paymentSettings.methods'),
            type: 'checkPicker',
            options: Object.values(PaymentMethodMollie).map(v => ({
              label: v,
              value: v,
            })),
          });
        }

        if (setting.type === PaymentProviderType.Payrexx) {
          fields.push({
            name: 'payrexx_instancename',
            label: t('integrations.paymentSettings.instanceName'),
          });
          fields.push({
            name: 'payrexx_vatrate',
            label: t('integrations.paymentSettings.vatRate'),
          });
          fields.push({
            name: 'payrexx_psp',
            label: t('integrations.paymentSettings.psp'),
            type: 'checkPicker',
            options: Object.values(PayrexxPsp).map(v => ({
              label: v,
              value: v,
            })),
          });
          fields.push({
            name: 'payrexx_pm',
            label: t('integrations.paymentSettings.pm'),
            type: 'checkPicker',
            options: Object.values(PayrexxPm).map(v => ({
              label: v,
              value: v,
            })),
          });
        }

        return fields;
      }}
    />
  );
}
