import { PaymentProviderType } from '@wepublish/editor/api';

import { creatablePaymentProviderTypes } from './paymentIntegrationForm';

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
