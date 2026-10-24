import { PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { PaymentProviderProps } from './payment-provider';
import { BexioPaymentProvider } from './bexio/bexio-payment-provider';
import { MolliePaymentProvider } from './mollie-payment-provider';
import { NeverChargePaymentProvider } from './never-charge-payment-provider';
import { PayrexxPaymentProvider } from './payrexx-payment-provider';
import { PayrexxSubscriptionPaymentProvider } from './payrexx-subscription-payment-provider';
import { SimulatedPaymentProvider } from './simulated-payment-provider';
import { StripeCheckoutPaymentProvider } from './stripe-checkout-payment-provider';
import { StripePaymentProvider } from './stripe-payment-provider';

const props: PaymentProviderProps = {
  id: 'provider',
  prisma: {} as PrismaClient,
  kv: {} as KvTtlCacheService,
};

describe('PaymentProvider.supportsStandaloneInvoices', () => {
  it.each([
    { provider: StripePaymentProvider, supported: true },
    { provider: StripeCheckoutPaymentProvider, supported: true },
    { provider: PayrexxPaymentProvider, supported: true },
    { provider: MolliePaymentProvider, supported: true },
    { provider: SimulatedPaymentProvider, supported: true },
    { provider: BexioPaymentProvider, supported: false },
    { provider: PayrexxSubscriptionPaymentProvider, supported: false },
    { provider: NeverChargePaymentProvider, supported: false },
  ])(
    '$provider.name supports standalone invoices: $supported',
    ({ provider, supported }) => {
      expect(new provider(props).supportsStandaloneInvoices).toBe(supported);
    }
  );
});
