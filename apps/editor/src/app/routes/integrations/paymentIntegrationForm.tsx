import {
  CreatePaymentProviderSettingDocument,
  getSettings,
  DeletePaymentProviderSettingDocument,
  PaymentMethodMollie,
  PaymentProviderSettingsDocument,
  PaymentProviderType,
  PayrexxPm,
  PayrexxPsp,
  SettingPaymentProvider,
  StripePaymentMethod,
  UpdatePaymentProviderSettingDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import bexioLogo from './assets/bexio.webp';
import mollieLogo from './assets/mollie.webp';
import payrexxLogo from './assets/payrexx.webp';
import stripeLogo from './assets/stripe.svg';
import { FieldDefinition } from './genericIntegrationForm';
import { GenericIntegrationList } from './genericIntegrationList';

// Mirrors the API's `isSimulatedPaymentAllowed`, which also refuses to create
// the simulated provider on production; this only keeps it out of the picker.
export const creatablePaymentProviderTypes = (appEnvironment?: string) =>
  Object.values(PaymentProviderType).filter(
    type =>
      type !== PaymentProviderType.Simulated ||
      (!!appEnvironment && appEnvironment !== 'production')
  );

const paymentSettingsSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  type: z.nativeEnum(PaymentProviderType).nullish(),
  offSessionPayments: z.boolean().nullish(),
  apiKey: z.string().nullish().or(z.literal('')),
  webhookEndpointSecret: z.string().nullish().or(z.literal('')),

  stripe_methods: z.array(z.nativeEnum(StripePaymentMethod)).nullish(),

  mollie_apiBaseUrl: z.string().nullish().or(z.literal('')),
  mollie_methods: z.array(z.nativeEnum(PaymentMethodMollie)).nullish(),

  payrexx_instancename: z.string().nullish().or(z.literal('')),
  payrexx_vatrate: z.string().nullish().or(z.literal('')),
  payrexx_psp: z.array(z.nativeEnum(PayrexxPsp)).nullish(),
  payrexx_pm: z.array(z.nativeEnum(PayrexxPm)).nullish(),
  simulated_declineRenewals: z.boolean().nullish(),

  bexio_userId: z.coerce.number().nullish(),
  bexio_countryId: z.coerce.number().nullish(),
  bexio_unitId: z.coerce.number().nullish(),
  bexio_taxId: z.coerce.number().nullish(),
  bexio_accountId: z.coerce.number().nullish(),
  bexio_invoiceTemplateNewMembership: z.string().nullish().or(z.literal('')),
  bexio_invoiceTemplateRenewalMembership: z
    .string()
    .nullish()
    .or(z.literal('')),
  bexio_invoiceMailSubjectNewMembership: z.string().nullish().or(z.literal('')),
  bexio_invoiceMailSubjectRenewalMembership: z
    .string()
    .nullish()
    .or(z.literal('')),
  bexio_invoiceMailBodyNewMembership: z.string().nullish().or(z.literal('')),
  bexio_invoiceMailBodyRenewalMembership: z
    .string()
    .nullish()
    .or(z.literal('')),
  bexio_markInvoiceAsOpen: z.boolean().nullish(),
  bexio_invoiceTitleNewMembership: z.string().nullish().or(z.literal('')),
  bexio_invoiceTitleRenewalMembership: z.string().nullish().or(z.literal('')),
});

type IntegrationFormValues = z.infer<typeof paymentSettingsSchema>;

export function PaymentIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<
      SettingPaymentProvider,
      z.infer<typeof paymentSettingsSchema>
    >
      query={PaymentProviderSettingsDocument}
      mutation={UpdatePaymentProviderSettingDocument}
      dataKey="paymentProviderSettings"
      schema={paymentSettingsSchema}
      registry={{
        createMutation: CreatePaymentProviderSettingDocument,
        deleteMutation: DeletePaymentProviderSettingDocument,
        types: creatablePaymentProviderTypes(getSettings().appEnvironment).map(
          value => ({
            label: value,
            value,
          })
        ),
      }}
      getLogo={setting => {
        switch (setting.type) {
          case PaymentProviderType.Bexio:
            return bexioLogo;
          case PaymentProviderType.Mollie:
            return mollieLogo;
          case PaymentProviderType.Payrexx:
          case PaymentProviderType.PayrexxSubscription:
            return payrexxLogo;
          case PaymentProviderType.Stripe:
          case PaymentProviderType.StripeCheckout:
            return stripeLogo;
          default:
            return undefined;
        }
      }}
      fields={setting => {
        let fields: FieldDefinition<IntegrationFormValues>[] = [
          {
            type: 'text',
            name: 'name',
            label: t('name'),
          },
          {
            type: 'text',
            name: 'type',
            label: t('integrations.paymentSettings.type'),
            info: t('integrations.paymentSettings.typeInfo'),
            disabled: true,
          },
          {
            name: 'offSessionPayments',
            label: t('integrations.paymentSettings.offSessionPayments'),
            info: t('integrations.paymentSettings.offSessionPaymentsInfo'),
            type: 'checkbox',
          },
          {
            name: 'apiKey',
            label: t('integrations.paymentSettings.apiKey'),
            info: t('integrations.paymentSettings.apiKeyInfo'),
            type: 'password',
            autoComplete: 'one-time-code',
            placeholder: t('integrations.placeholderSecret'),
          },
          {
            name: 'webhookEndpointSecret',
            label: t('integrations.paymentSettings.webhookEndpointSecret'),
            info: t('integrations.paymentSettings.webhookEndpointSecretInfo'),
            type: 'password',
            autoComplete: 'one-time-code',
            placeholder: t('integrations.placeholderSecret'),
          },
        ];

        if (setting.type === PaymentProviderType.Bexio) {
          fields = fields.filter(
            ({ name }) => name !== 'webhookEndpointSecret'
          );

          fields.push(
            {
              name: 'bexio_userId',
              label: t('integrations.paymentSettings.bexioUserId'),
              info: t('integrations.paymentSettings.bexioUserIdInfo'),
              type: 'number',
            },
            {
              name: 'bexio_countryId',
              label: t('integrations.paymentSettings.bexioCountryId'),
              info: t('integrations.paymentSettings.bexioCountryIdInfo'),
              type: 'number',
            },
            {
              name: 'bexio_unitId',
              label: t('integrations.paymentSettings.bexioUnitId'),
              info: t('integrations.paymentSettings.bexioUnitIdInfo'),
              type: 'number',
            },
            {
              name: 'bexio_taxId',
              label: t('integrations.paymentSettings.bexioTaxId'),
              info: t('integrations.paymentSettings.bexioTaxIdInfo'),
              type: 'number',
            },
            {
              name: 'bexio_accountId',
              label: t('integrations.paymentSettings.bexioAccountId'),
              info: t('integrations.paymentSettings.bexioAccountIdInfo'),
              type: 'number',
            },
            {
              type: 'text',
              name: 'bexio_invoiceTemplateNewMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceTemplateNewMembership'
              ),
              info: t('integrations.paymentSettings.bexioInvoiceTemplateInfo'),
            },
            {
              type: 'text',
              name: 'bexio_invoiceTemplateRenewalMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceTemplateRenewalMembership'
              ),
              info: t('integrations.paymentSettings.bexioInvoiceTemplateInfo'),
            },
            {
              type: 'text',
              name: 'bexio_invoiceTitleNewMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceTitleNewMembership'
              ),
              info: t('integrations.paymentSettings.bexioInvoiceTitleInfo'),
            },
            {
              type: 'text',
              name: 'bexio_invoiceTitleRenewalMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceTitleRenewalMembership'
              ),
              info: t('integrations.paymentSettings.bexioInvoiceTitleInfo'),
            },
            {
              type: 'text',
              name: 'bexio_invoiceMailSubjectNewMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceMailSubjectNewMembership'
              ),
              info: t(
                'integrations.paymentSettings.bexioInvoiceMailSubjectInfo'
              ),
            },
            {
              type: 'text',
              name: 'bexio_invoiceMailSubjectRenewalMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceMailSubjectRenewalMembership'
              ),
              info: t(
                'integrations.paymentSettings.bexioInvoiceMailSubjectInfo'
              ),
            },
            {
              name: 'bexio_invoiceMailBodyNewMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceMailBodyNewMembership'
              ),
              info: t('integrations.paymentSettings.bexioInvoiceMailBodyInfo'),
              type: 'textarea',
              rows: 10,
            },
            {
              name: 'bexio_invoiceMailBodyRenewalMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceMailBodyRenewalMembership'
              ),
              info: t('integrations.paymentSettings.bexioInvoiceMailBodyInfo'),
              type: 'textarea',
              rows: 10,
            },
            {
              name: 'bexio_markInvoiceAsOpen',
              label: t('integrations.paymentSettings.bexioMarkInvoiceAsOpen'),
              info: t(
                'integrations.paymentSettings.bexioMarkInvoiceAsOpenInfo'
              ),
              type: 'checkbox',
            }
          );
        }

        if (
          [
            PaymentProviderType.Stripe,
            PaymentProviderType.StripeCheckout,
          ].includes(setting.type)
        ) {
          fields.push({
            name: 'stripe_methods',
            label: t('integrations.paymentSettings.methods'),
            info: t('integrations.paymentSettings.methodsInfo'),
            type: 'checkPicker',
            searchable: true,
            options: Object.values(StripePaymentMethod).map(v => ({
              label: v,
              value: v,
            })),
          });
        }

        if (setting.type === PaymentProviderType.Mollie) {
          fields.push({
            type: 'text',
            name: 'mollie_apiBaseUrl',
            label: t('integrations.paymentSettings.apiUrl'),
            info: t('integrations.paymentSettings.apiUrlInfo'),
          });
          fields.push({
            name: 'mollie_methods',
            label: t('integrations.paymentSettings.methods'),
            info: t('integrations.paymentSettings.methodsInfo'),
            type: 'checkPicker',
            searchable: true,
            options: Object.values(PaymentMethodMollie).map(v => ({
              label: v,
              value: v,
            })),
          });
        }

        if (setting.type === PaymentProviderType.Payrexx) {
          fields.push({
            type: 'text',
            name: 'payrexx_instancename',
            label: t('integrations.paymentSettings.instanceName'),
            info: t('integrations.paymentSettings.instanceNameInfo'),
          });
          fields.push({
            type: 'text',
            name: 'payrexx_vatrate',
            label: t('integrations.paymentSettings.vatRate'),
            info: t('integrations.paymentSettings.vatRateInfo'),
          });
          fields.push({
            name: 'payrexx_psp',
            label: t('integrations.paymentSettings.psp'),
            info: t('integrations.paymentSettings.pspInfo'),
            type: 'checkPicker',
            searchable: true,
            options: Object.values(PayrexxPsp).map(v => ({
              label: v,
              value: v,
            })),
          });
          fields.push({
            name: 'payrexx_pm',
            label: t('integrations.paymentSettings.pm'),
            info: t('integrations.paymentSettings.methodsInfo'),
            type: 'checkPicker',
            searchable: true,
            options: Object.values(PayrexxPm).map(v => ({
              label: v,
              value: v,
            })),
          });
        }

        if (setting.type === PaymentProviderType.Simulated) {
          fields.push({
            name: 'simulated_declineRenewals',
            label: t('integrations.paymentSettings.declineRenewals'),
            type: 'checkbox',
          });
        }

        if (setting.type === PaymentProviderType.PayrexxSubscription) {
          fields.push({
            type: 'text',
            name: 'payrexx_instancename',
            label: t('integrations.paymentSettings.instanceName'),
            info: t('integrations.paymentSettings.instanceNameInfo'),
          });
        }

        return fields;
      }}
    />
  );
}
