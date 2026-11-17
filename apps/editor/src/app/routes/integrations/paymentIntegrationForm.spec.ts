import { PaymentProviderType } from '@wepublish/editor/api';

import {
  creatablePaymentProviderTypes,
  paymentApiKeyInfo,
  paymentWebhookSecretInfo,
  withPaymentSections,
} from './paymentIntegrationForm';

describe('creatablePaymentProviderTypes', () => {
  it('offers the simulated provider outside of production', () => {
    expect(creatablePaymentProviderTypes('review')).toContain(
      PaymentProviderType.Simulated
    );
  });

  it('hides the simulated provider on production', () => {
    const types = creatablePaymentProviderTypes('production');

    expect(types).not.toContain(PaymentProviderType.Simulated);
    expect(types).toContain(PaymentProviderType.Stripe);
  });

  it('hides the simulated provider when the environment is not declared', () => {
    expect(creatablePaymentProviderTypes('')).not.toContain(
      PaymentProviderType.Simulated
    );
  });
});

describe('withPaymentSections', () => {
  it('groups the fields by setup step, connection first', () => {
    const fields = withPaymentSections(
      [
        { type: 'checkbox', name: 'bexio_contactSync', label: 'sync' },
        { type: 'number', name: 'bexio_userId', label: 'user' },
        {
          type: 'text',
          name: 'bexio_invoiceTitleNewMembership',
          label: 'title',
        },
        { type: 'checkbox', name: 'offSessionPayments', label: 'off' },
        { type: 'password', name: 'apiKey', label: 'key' },
        { type: 'text', name: 'name', label: 'name' },
      ],
      key => key
    );

    expect(fields.map(field => [field.name, field.section])).toEqual([
      ['apiKey', 'integrations.sections.connection'],
      ['offSessionPayments', 'integrations.sections.checkout'],
      ['bexio_userId', 'integrations.sections.bexioRecords'],
      ['bexio_invoiceTitleNewMembership', 'integrations.sections.invoiceTexts'],
      ['bexio_contactSync', 'integrations.sections.contacts'],
      ['name', 'integrations.sections.general'],
    ]);
  });
});

describe('paymentWebhookSecretInfo', () => {
  it('explains the secret of the provider at hand', () => {
    expect(
      paymentWebhookSecretInfo(PaymentProviderType.StripeCheckout, key => key)
    ).toBe('integrations.paymentSettings.webhookSecretInfo.stripe');
    expect(
      paymentWebhookSecretInfo(PaymentProviderType.Payrexx, key => key)
    ).toBe('integrations.paymentSettings.webhookSecretInfo.payrexx');
    expect(
      paymentWebhookSecretInfo(PaymentProviderType.Mollie, key => key)
    ).toBe('integrations.paymentSettings.webhookSecretInfo.mollie');
  });
});

describe('paymentApiKeyInfo', () => {
  it('says where the key of the provider at hand is found', () => {
    expect(paymentApiKeyInfo(PaymentProviderType.Stripe, key => key)).toBe(
      'integrations.paymentSettings.apiKeyInfoByType.stripe'
    );
    expect(
      paymentApiKeyInfo(PaymentProviderType.PayrexxSubscription, key => key)
    ).toBe('integrations.paymentSettings.apiKeyInfoByType.payrexx');
    expect(paymentApiKeyInfo(PaymentProviderType.Bexio, key => key)).toBe(
      'integrations.paymentSettings.apiKeyInfoByType.bexio'
    );
  });
});
