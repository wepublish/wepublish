import { PaymentProviderType } from '@wepublish/editor/api';

import {
  bexioTestMailboxFields,
  creatablePaymentProviderTypes,
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

describe('bexioTestMailboxFields', () => {
  const t = (key: string) => key;

  it('offers the test mailbox outside of production', () => {
    expect(bexioTestMailboxFields('review', t).map(field => field.name)).toEqual(
      ['bexio_testMailbox']
    );
  });

  it('hides the test mailbox on production', () => {
    expect(bexioTestMailboxFields('production', t)).toEqual([]);
  });

  it('hides the test mailbox when the environment is not declared', () => {
    expect(bexioTestMailboxFields('', t)).toEqual([]);
  });
});
