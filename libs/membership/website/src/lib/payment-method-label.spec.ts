import { mockPaymentMethod } from '@wepublish/mocks/website';
import i18next, { t } from 'i18next';

import { paymentMethodLabel } from './payment-method-label';

const method = (paymentProviderID: string, name = 'Intern') =>
  mockPaymentMethod({ paymentProviderID, name });

describe('paymentMethodLabel', () => {
  it.each([
    ['bexio', 'Rechnung'],
    ['payrexx', 'Online-Zahlung'],
    ['payrexx-subscription', 'Online-Zahlung'],
    ['stripe', 'Kreditkarte'],
    ['stripe-checkout', 'Kreditkarte'],
    ['mollie', 'Online-Zahlung'],
    ['no-charge', 'Kostenlos'],
  ])('names %s the way readers know it: %s', (provider, label) => {
    expect(paymentMethodLabel(t, method(provider))).toBe(label);
  });

  // e.g. a medium whose Payrexx offers cards and TWINT
  it('takes the label a tenant overrides', () => {
    i18next.addResource(
      'de',
      'translation',
      'paymentMethodLabels.payrexx',
      'Karte oder TWINT'
    );
    onTestFinished(() => {
      i18next.addResource(
        'de',
        'translation',
        'paymentMethodLabels.payrexx',
        'Online-Zahlung'
      );
    });

    expect(paymentMethodLabel(t, method('payrexx'))).toBe('Karte oder TWINT');
  });

  it('falls back to the name of an unknown payment provider', () => {
    expect(
      paymentMethodLabel(t, method('custom-provider', 'Banküberweisung'))
    ).toBe('Banküberweisung');
  });
});
