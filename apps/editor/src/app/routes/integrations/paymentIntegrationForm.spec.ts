import { PaymentProviderType } from '@wepublish/editor/api';

import {
  bexioLookups,
  bexioSteps,
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

describe('bexioSteps', () => {
  const t = (key: string) => key;
  const ids = {
    bexio_userId: 1,
    bexio_countryId: 1,
    bexio_unitId: 2,
    bexio_taxId: 28,
    bexio_accountId: 7,
  };

  it('starts with the token, as the records come from bexio with it', () => {
    const steps = bexioSteps({}, t);

    expect(steps.map(({ title }) => title)).toEqual([
      'integrations.paymentSettings.bexioSteps.connect',
      'integrations.paymentSettings.bexioSteps.records',
      'integrations.paymentSettings.bexioSteps.invoices',
      'integrations.paymentSettings.bexioSteps.contacts',
    ]);
    expect(steps[0]).toMatchObject({
      sections: ['integrations.sections.connection'],
      complete: false,
    });
  });

  it('counts the records as done once every id is chosen', () => {
    expect(bexioSteps({ isApiKeySet: true }, t)[1].complete).toBe(false);
    expect(bexioSteps({ isApiKeySet: true, ...ids }, t)[1].complete).toBe(true);
  });
});

describe('bexioLookups', () => {
  it('offers what bexio has for each id the integration needs', () => {
    const option = (id: number, label: string) => ({ id, label });

    expect(
      bexioLookups({
        accounts: [option(7, '3400 Abonnemente')],
        taxes: [option(28, 'UN81 (8.1%)')],
        units: [option(2, 'Stk')],
        users: [option(1, 'Mia Muster')],
        countries: [option(1, 'Schweiz (CH)')],
      })
    ).toEqual({
      bexio_accountId: [{ value: 7, label: '3400 Abonnemente' }],
      bexio_taxId: [{ value: 28, label: 'UN81 (8.1%)' }],
      bexio_unitId: [{ value: 2, label: 'Stk' }],
      bexio_userId: [{ value: 1, label: 'Mia Muster' }],
      bexio_countryId: [{ value: 1, label: 'Schweiz (CH)' }],
    });
  });
});
