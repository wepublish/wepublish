import {
  type PaymentProviderSettingsQuery,
  type UpdatePaymentProviderSettingMutationVariables,
  PaymentMethodMollie,
  PaymentProviderType,
  PayrexxPm,
  PayrexxPsp,
  StripePaymentMethod,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

const text = () => z.string().nullish();
const id = () => z.number().nullish();
const flag = () => z.boolean().nullish();

export const paymentSettingSchema = z.object({
  name: text().meta({ label: 'name' }),
  type: z.enum(PaymentProviderType).meta({
    label: 'integrations.paymentSettings.type',
    description: 'integrations.paymentSettings.typeInfo',
  }),
  offSessionPayments: flag().meta({
    label: 'integrations.paymentSettings.offSessionPayments',
    description: 'integrations.paymentSettings.offSessionPaymentsInfo',
  }),
  apiKey: formFields.secret().meta({
    label: 'integrations.paymentSettings.apiKey',
    description: 'integrations.paymentSettings.apiKeyInfo',
  }),
  webhookEndpointSecret: formFields.secret().meta({
    label: 'integrations.paymentSettings.webhookEndpointSecret',
    description: 'integrations.paymentSettings.webhookEndpointSecretInfo',
  }),
  stripe_methods: z.array(z.enum(StripePaymentMethod)).nullish().meta({
    label: 'integrations.paymentSettings.methods',
    description: 'integrations.paymentSettings.methodsInfo',
  }),
  mollie_apiBaseUrl: text().meta({
    label: 'integrations.paymentSettings.apiUrl',
    description: 'integrations.paymentSettings.apiUrlInfo',
  }),
  mollie_methods: z.array(z.enum(PaymentMethodMollie)).nullish().meta({
    label: 'integrations.paymentSettings.methods',
    description: 'integrations.paymentSettings.methodsInfo',
  }),
  payrexx_instancename: text().meta({
    label: 'integrations.paymentSettings.instanceName',
    description: 'integrations.paymentSettings.instanceNameInfo',
  }),
  payrexx_vatrate: text().meta({
    label: 'integrations.paymentSettings.vatRate',
    description: 'integrations.paymentSettings.vatRateInfo',
  }),
  payrexx_psp: z.array(z.enum(PayrexxPsp)).nullish().meta({
    label: 'integrations.paymentSettings.psp',
    description: 'integrations.paymentSettings.pspInfo',
  }),
  payrexx_pm: z.array(z.enum(PayrexxPm)).nullish().meta({
    label: 'integrations.paymentSettings.pm',
    description: 'integrations.paymentSettings.methodsInfo',
  }),
  simulated_declineRenewals: flag().meta({
    label: 'integrations.paymentSettings.declineRenewals',
  }),
  bexio_userId: id().meta({
    label: 'integrations.paymentSettings.bexioUserId',
    description: 'integrations.paymentSettings.bexioUserIdInfo',
  }),
  bexio_countryId: id().meta({
    label: 'integrations.paymentSettings.bexioCountryId',
    description: 'integrations.paymentSettings.bexioCountryIdInfo',
  }),
  bexio_unitId: id().meta({
    label: 'integrations.paymentSettings.bexioUnitId',
    description: 'integrations.paymentSettings.bexioUnitIdInfo',
  }),
  bexio_taxId: id().meta({
    label: 'integrations.paymentSettings.bexioTaxId',
    description: 'integrations.paymentSettings.bexioTaxIdInfo',
  }),
  bexio_accountId: id().meta({
    label: 'integrations.paymentSettings.bexioAccountId',
    description: 'integrations.paymentSettings.bexioAccountIdInfo',
  }),
  bexio_invoiceTemplateNewMembership: text().meta({
    label: 'integrations.paymentSettings.bexioInvoiceTemplateNewMembership',
    description: 'integrations.paymentSettings.bexioInvoiceTemplateInfo',
  }),
  bexio_invoiceTemplateRenewalMembership: text().meta({
    label: 'integrations.paymentSettings.bexioInvoiceTemplateRenewalMembership',
    description: 'integrations.paymentSettings.bexioInvoiceTemplateInfo',
  }),
  bexio_invoiceTitleNewMembership: text().meta({
    label: 'integrations.paymentSettings.bexioInvoiceTitleNewMembership',
    description: 'integrations.paymentSettings.bexioInvoiceTitleInfo',
  }),
  bexio_invoiceTitleRenewalMembership: text().meta({
    label: 'integrations.paymentSettings.bexioInvoiceTitleRenewalMembership',
    description: 'integrations.paymentSettings.bexioInvoiceTitleInfo',
  }),
  bexio_invoiceMailSubjectNewMembership: text().meta({
    label: 'integrations.paymentSettings.bexioInvoiceMailSubjectNewMembership',
    description: 'integrations.paymentSettings.bexioInvoiceMailSubjectInfo',
  }),
  bexio_invoiceMailSubjectRenewalMembership: text().meta({
    label:
      'integrations.paymentSettings.bexioInvoiceMailSubjectRenewalMembership',
    description: 'integrations.paymentSettings.bexioInvoiceMailSubjectInfo',
  }),
  bexio_invoiceMailBodyNewMembership: formFields.textarea().nullish().meta({
    label: 'integrations.paymentSettings.bexioInvoiceMailBodyNewMembership',
    description: 'integrations.paymentSettings.bexioInvoiceMailBodyInfo',
  }),
  bexio_invoiceMailBodyRenewalMembership: formFields
    .textarea()
    .nullish()
    .meta({
      label:
        'integrations.paymentSettings.bexioInvoiceMailBodyRenewalMembership',
      description: 'integrations.paymentSettings.bexioInvoiceMailBodyInfo',
    }),
  bexio_markInvoiceAsOpen: flag().meta({
    label: 'integrations.paymentSettings.bexioMarkInvoiceAsOpen',
    description: 'integrations.paymentSettings.bexioMarkInvoiceAsOpenInfo',
  }),
});

type PaymentSettingKey = Exclude<
  keyof z.output<typeof paymentSettingSchema>,
  'type'
>;

const shared = [
  'name',
  'offSessionPayments',
  'apiKey',
  'webhookEndpointSecret',
] as const satisfies PaymentSettingKey[];

const stripe = [...shared, 'stripe_methods'] as const;

export const bexioKeys = [
  'bexio_userId',
  'bexio_countryId',
  'bexio_unitId',
  'bexio_taxId',
  'bexio_accountId',
  'bexio_invoiceTemplateNewMembership',
  'bexio_invoiceTemplateRenewalMembership',
  'bexio_invoiceTitleNewMembership',
  'bexio_invoiceTitleRenewalMembership',
  'bexio_invoiceMailSubjectNewMembership',
  'bexio_invoiceMailSubjectRenewalMembership',
  'bexio_invoiceMailBodyNewMembership',
  'bexio_invoiceMailBodyRenewalMembership',
  'bexio_markInvoiceAsOpen',
] as const satisfies PaymentSettingKey[];

export const paymentSettingKeys: Record<
  PaymentProviderType,
  readonly PaymentSettingKey[]
> = {
  [PaymentProviderType.Bexio]: [
    'name',
    'offSessionPayments',
    'apiKey',
    ...bexioKeys,
  ],
  [PaymentProviderType.Mollie]: [
    ...shared,
    'mollie_apiBaseUrl',
    'mollie_methods',
  ],
  [PaymentProviderType.NoCharge]: shared,
  [PaymentProviderType.Payrexx]: [
    ...shared,
    'payrexx_instancename',
    'payrexx_vatrate',
    'payrexx_psp',
    'payrexx_pm',
  ],
  [PaymentProviderType.PayrexxSubscription]: [
    ...shared,
    'payrexx_instancename',
  ],
  [PaymentProviderType.Simulated]: [...shared, 'simulated_declineRenewals'],
  [PaymentProviderType.Stripe]: stripe,
  [PaymentProviderType.StripeCheckout]: stripe,
};

export const hasPaymentSettingKey = (
  type: PaymentProviderType | null | undefined,
  key: PaymentSettingKey
) => type != null && paymentSettingKeys[type].includes(key);

export type PaymentSetting =
  PaymentProviderSettingsQuery['paymentProviderSettings'][number];

export const fromPaymentSetting = (
  setting: PaymentSetting
): FormDefaultValues<typeof paymentSettingSchema> => setting;

type PaymentSettingOutput = FormOutput<typeof paymentSettingSchema>;

const pick = <K extends PaymentSettingKey>(
  values: PaymentSettingOutput,
  keys: readonly K[]
) =>
  Object.fromEntries(keys.map(key => [key, values[key]])) as Pick<
    PaymentSettingOutput,
    K
  >;

export const toPaymentSettingVariables = (
  id: string,
  values: PaymentSettingOutput
): UpdatePaymentProviderSettingMutationVariables => ({
  id,
  ...pick(values, paymentSettingKeys[values.type]),
});
