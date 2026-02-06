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
  // Bexio
  bexio_userId: z.coerce.number().optional(),
  bexio_countryId: z.coerce.number().optional(),
  bexio_unitId: z.coerce.number().optional(),
  bexio_taxId: z.coerce.number().optional(),
  bexio_accountId: z.coerce.number().optional(),
  bexio_invoiceTemplateNewMembership: z.string().optional(),
  bexio_invoiceTemplateRenewalMembership: z.string().optional(),
  bexio_invoiceMailSubjectNewMembership: z.string().optional(),
  bexio_invoiceMailSubjectRenewalMembership: z.string().optional(),
  bexio_invoiceMailBodyNewMembership: z.string().optional(),
  bexio_invoiceMailBodyRenewalMembership: z.string().optional(),
  bexio_markInvoiceAsOpen: z.boolean().optional(),
  bexio_invoiceTitleNewMembership: z.string().optional(),
  bexio_invoiceTitleRenewalMembership: z.string().optional(),
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
        bexio_userId: setting.bexio_userId ?? undefined,
        bexio_countryId: setting.bexio_countryId ?? undefined,
        bexio_unitId: setting.bexio_unitId ?? undefined,
        bexio_taxId: setting.bexio_taxId ?? undefined,
        bexio_accountId: setting.bexio_accountId ?? undefined,
        bexio_invoiceTemplateNewMembership:
          setting.bexio_invoiceTemplateNewMembership ?? undefined,
        bexio_invoiceTemplateRenewalMembership:
          setting.bexio_invoiceTemplateRenewalMembership ?? undefined,
        bexio_invoiceMailSubjectNewMembership:
          setting.bexio_invoiceMailSubjectNewMembership ?? undefined,
        bexio_invoiceMailSubjectRenewalMembership:
          setting.bexio_invoiceMailSubjectRenewalMembership ?? undefined,
        bexio_invoiceMailBodyNewMembership:
          setting.bexio_invoiceMailBodyNewMembership ?? undefined,
        bexio_invoiceMailBodyRenewalMembership:
          setting.bexio_invoiceMailBodyRenewalMembership ?? undefined,
        bexio_markInvoiceAsOpen: setting.bexio_markInvoiceAsOpen ?? undefined,
        bexio_invoiceTitleNewMembership:
          setting.bexio_invoiceTitleNewMembership ?? undefined,
        bexio_invoiceTitleRenewalMembership:
          setting.bexio_invoiceTitleRenewalMembership ?? undefined,
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
        bexioUserId: formData.bexio_userId,
        bexioCountryId: formData.bexio_countryId,
        bexioUnitId: formData.bexio_unitId,
        bexioTaxId: formData.bexio_taxId,
        bexioAccountId: formData.bexio_accountId,
        bexioInvoiceTemplateNewMembership:
          formData.bexio_invoiceTemplateNewMembership,
        bexioInvoiceTemplateRenewalMembership:
          formData.bexio_invoiceTemplateRenewalMembership,
        bexioInvoiceMailSubjectNewMembership:
          formData.bexio_invoiceMailSubjectNewMembership,
        bexioInvoiceMailSubjectRenewalMembership:
          formData.bexio_invoiceMailSubjectRenewalMembership,
        bexioInvoiceMailBodyNewMembership:
          formData.bexio_invoiceMailBodyNewMembership,
        bexioInvoiceMailBodyRenewalMembership:
          formData.bexio_invoiceMailBodyRenewalMembership,
        bexioMarkInvoiceAsOpen: formData.bexio_markInvoiceAsOpen,
        bexioInvoiceTitleNewMembership:
          formData.bexio_invoiceTitleNewMembership,
        bexioInvoiceTitleRenewalMembership:
          formData.bexio_invoiceTitleRenewalMembership,
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
              name: 'bexio_invoiceTemplateNewMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceTemplateNewMembership'
              ),
            },
            {
              name: 'bexio_invoiceTemplateRenewalMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceTemplateRenewalMembership'
              ),
            },
            {
              name: 'bexio_invoiceTitleNewMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceTitleNewMembership'
              ),
            },
            {
              name: 'bexio_invoiceTitleRenewalMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceTitleRenewalMembership'
              ),
            },
            {
              name: 'bexio_invoiceMailSubjectNewMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceMailSubjectNewMembership'
              ),
            },
            {
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
              textareaRows: 10,
            },
            {
              name: 'bexio_invoiceMailBodyRenewalMembership',
              label: t(
                'integrations.paymentSettings.bexioInvoiceMailBodyRenewalMembership'
              ),
              type: 'textarea',
              textareaRows: 10,
            },
            {
              name: 'bexio_markInvoiceAsOpen',
              label: t('integrations.paymentSettings.bexioMarkInvoiceAsOpen'),
              type: 'checkbox',
            }
          );
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
