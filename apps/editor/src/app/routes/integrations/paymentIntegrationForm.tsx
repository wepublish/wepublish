import {
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

const paymentSettingsSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  type: z.nativeEnum(PaymentProviderType).optional(),
  offSessionPayments: z.boolean().optional(),
  apiKey: z.string().nullish().or(z.literal('')),
  webhookEndpointSecret: z.string().nullish().or(z.literal('')),

  stripe_methods: z.array(z.nativeEnum(StripePaymentMethod)).optional(),

  mollie_apiBaseUrl: z.string().nullish().or(z.literal('')),
  mollie_methods: z.array(z.nativeEnum(PaymentMethodMollie)).optional(),

  payrexx_instancename: z.string().nullish().or(z.literal('')),
  payrexx_vatrate: z.string().nullish().or(z.literal('')),
  payrexx_psp: z.array(z.nativeEnum(PayrexxPsp)).optional(),
  payrexx_pm: z.array(z.nativeEnum(PayrexxPm)).optional(),

  bexio_userId: z.coerce.number().optional(),
  bexio_countryId: z.coerce.number().optional(),
  bexio_unitId: z.coerce.number().optional(),
  bexio_taxId: z.coerce.number().optional(),
  bexio_accountId: z.coerce.number().optional(),
  bexio_invoiceTemplateNewMembership: z.string().nullish().or(z.literal('')),
  bexio_invoiceTemplateRenewalMembership: z
    .string()
    .optional()
    .or(z.literal('')),
  bexio_invoiceMailSubjectNewMembership: z
    .string()
    .optional()
    .or(z.literal('')),
  bexio_invoiceMailSubjectRenewalMembership: z
    .string()
    .optional()
    .or(z.literal('')),
  bexio_invoiceMailBodyNewMembership: z.string().nullish().or(z.literal('')),
  bexio_invoiceMailBodyRenewalMembership: z
    .string()
    .optional()
    .or(z.literal('')),
  bexio_markInvoiceAsOpen: z.boolean().optional(),
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
            autoComplete: 'one-time-code',
            placeholder: t('integrations.placeholderSecret'),
          },
          {
            name: 'webhookEndpointSecret',
            label: t('integrations.paymentSettings.webhookEndpointSecret'),
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
              type: 'number',
            },
            {
              name: 'bexio_countryId',
              label: t('integrations.paymentSettings.bexioCountryId'),
              type: 'number',
            },
            {
              name: 'bexio_unitId',
              label: t('integrations.paymentSettings.bexioUnitId'),
              type: 'number',
            },
            {
              name: 'bexio_taxId',
              label: t('integrations.paymentSettings.bexioTaxId'),
              type: 'number',
            },
            {
              name: 'bexio_accountId',
              label: t('integrations.paymentSettings.bexioAccountId'),
              type: 'number',
            },
            {
              type: 'text',
              name: 'bexio_invoiceTemplateNewMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceTemplateNewMembership'
              ),
            },
            {
              type: 'text',
              name: 'bexio_invoiceTemplateRenewalMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceTemplateRenewalMembership'
              ),
            },
            {
              type: 'text',
              name: 'bexio_invoiceTitleNewMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceTitleNewMembership'
              ),
            },
            {
              type: 'text',
              name: 'bexio_invoiceTitleRenewalMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceTitleRenewalMembership'
              ),
            },
            {
              type: 'text',
              name: 'bexio_invoiceMailSubjectNewMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceMailSubjectNewMembership'
              ),
            },
            {
              type: 'text',
              name: 'bexio_invoiceMailSubjectRenewalMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceMailSubjectRenewalMembership'
              ),
            },
            {
              name: 'bexio_invoiceMailBodyNewMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceMailBodyNewMembership'
              ),
              type: 'textarea',
              rows: 10,
            },
            {
              name: 'bexio_invoiceMailBodyRenewalMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceMailBodyRenewalMembership'
              ),
              type: 'textarea',
              rows: 10,
            },
            {
              name: 'bexio_markInvoiceAsOpen',
              label: t('integrations.paymentSettings.bexioMarkInvoiceAsOpen'),
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
          });
          fields.push({
            name: 'mollie_methods',
            label: t('integrations.paymentSettings.methods'),
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
          });
          fields.push({
            type: 'text',
            name: 'payrexx_vatrate',
            label: t('integrations.paymentSettings.vatRate'),
          });
          fields.push({
            name: 'payrexx_psp',
            label: t('integrations.paymentSettings.psp'),
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
            type: 'checkPicker',
            searchable: true,
            options: Object.values(PayrexxPm).map(v => ({
              label: v,
              value: v,
            })),
          });
        }

        if (setting.type === PaymentProviderType.PayrexxSubscription) {
          fields.push({
            type: 'text',
            name: 'payrexx_instancename',
            label: t('integrations.paymentSettings.instanceName'),
          });
        }

        return fields;
      }}
    />
  );
}
