import { type FormValues, formView } from '@wepublish/form/editor';

import { integrationPaths } from './integrationPaths';
import {
  bexioKeys,
  hasPaymentSettingKey,
  paymentSettingSchema,
} from './paymentIntegration.schema';

type PaymentSettingValues = FormValues<typeof paymentSettingSchema>;
type PaymentSettingKey = Parameters<typeof hasPaymentSettingKey>[1];

const unlessShown =
  (key: PaymentSettingKey) =>
  ({ type }: PaymentSettingValues) =>
    !hasPaymentSettingKey(type, key);

const providerKeys = [
  'stripe_methods',
  'mollie_apiBaseUrl',
  'mollie_methods',
  'payrexx_instancename',
  'payrexx_vatrate',
  'payrexx_psp',
  'payrexx_pm',
  'simulated_declineRenewals',
] as const;

const unlessAnyShown =
  (keys: readonly PaymentSettingKey[]) =>
  ({ type }: PaymentSettingValues) =>
    !keys.some(key => hasPaymentSettingKey(type, key));

export const paymentSettingView = formView(paymentSettingSchema, {
  paths: integrationPaths('payment'),
  sections: [
    { fields: ['name', 'type', 'offSessionPayments'] },
    {
      title: 'integrations.paymentSettings.credentials',
      fields: ['apiKey', 'webhookEndpointSecret'],
    },
    {
      title: 'integrations.paymentSettings.provider',
      hidden: unlessAnyShown(providerKeys),
      fields: providerKeys,
    },
    {
      title: 'integrations.paymentSettings.bexioAccounting',
      hidden: unlessAnyShown(bexioKeys),
      fields: [
        ['bexio_userId', 'bexio_accountId'],
        ['bexio_countryId', 'bexio_unitId', 'bexio_taxId'],
      ],
    },
    {
      title: 'integrations.paymentSettings.bexioInvoice',
      hidden: unlessAnyShown(bexioKeys),
      fields: [
        [
          'bexio_invoiceTemplateNewMembership',
          'bexio_invoiceTemplateRenewalMembership',
        ],
        [
          'bexio_invoiceTitleNewMembership',
          'bexio_invoiceTitleRenewalMembership',
        ],
        'bexio_invoiceMailSubjectNewMembership',
        'bexio_invoiceMailBodyNewMembership',
        'bexio_invoiceMailSubjectRenewalMembership',
        'bexio_invoiceMailBodyRenewalMembership',
        'bexio_markInvoiceAsOpen',
      ],
    },
  ],
  fields: {
    type: { disabled: true },
    webhookEndpointSecret: { hidden: unlessShown('webhookEndpointSecret') },
    stripe_methods: { hidden: unlessShown('stripe_methods') },
    mollie_apiBaseUrl: { hidden: unlessShown('mollie_apiBaseUrl') },
    mollie_methods: { hidden: unlessShown('mollie_methods') },
    payrexx_instancename: { hidden: unlessShown('payrexx_instancename') },
    payrexx_vatrate: { hidden: unlessShown('payrexx_vatrate') },
    payrexx_psp: { hidden: unlessShown('payrexx_psp') },
    payrexx_pm: { hidden: unlessShown('payrexx_pm') },
    simulated_declineRenewals: {
      hidden: unlessShown('simulated_declineRenewals'),
    },
    bexio_invoiceMailBodyNewMembership: { props: { minRows: 10 } },
    bexio_invoiceMailBodyRenewalMembership: { props: { minRows: 10 } },
  },
});
