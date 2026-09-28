import { PaymentProviderType, PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import bodyParser from 'body-parser';
import { PaymentProvider } from './payment-provider';
import { BexioPaymentProvider } from './bexio/bexio-payment-provider';
import { MolliePaymentProvider } from './mollie-payment-provider';
import { NeverChargePaymentProvider } from './never-charge-payment-provider';
import { PayrexxPaymentProvider } from './payrexx-payment-provider';
import { PayrexxSubscriptionPaymentProvider } from './payrexx-subscription-payment-provider';
import { StripeCheckoutPaymentProvider } from './stripe-checkout-payment-provider';
import { StripePaymentProvider } from './stripe-payment-provider';

export type PaymentProviderDeps = {
  prisma: PrismaClient;
  kv: KvTtlCacheService;
};

const jsonBody = () => bodyParser.json();
const rawJsonBody = () => bodyParser.raw({ type: 'application/json' });
const formBody = () => bodyParser.urlencoded({ extended: true });

export const createPaymentProvider = (
  id: string,
  type: PaymentProviderType,
  { prisma, kv }: PaymentProviderDeps
): PaymentProvider => {
  switch (type) {
    case PaymentProviderType.STRIPE_CHECKOUT:
      return new StripeCheckoutPaymentProvider({
        id,
        incomingRequestHandler: rawJsonBody(),
        prisma,
        kv,
      });
    case PaymentProviderType.STRIPE:
      return new StripePaymentProvider({
        id,
        incomingRequestHandler: rawJsonBody(),
        prisma,
        kv,
      });
    case PaymentProviderType.PAYREXX:
      return new PayrexxPaymentProvider({
        id,
        incomingRequestHandler: jsonBody(),
        prisma,
        kv,
      });
    case PaymentProviderType.PAYREXX_SUBSCRIPTION:
      return new PayrexxSubscriptionPaymentProvider({ id, prisma, kv });
    case PaymentProviderType.BEXIO:
      return new BexioPaymentProvider({ id, prisma, kv });
    case PaymentProviderType.MOLLIE:
      return new MolliePaymentProvider({
        id,
        incomingRequestHandler: formBody(),
        prisma,
        kv,
      });
    case PaymentProviderType.NO_CHARGE:
      return new NeverChargePaymentProvider({ id, prisma, kv });
    default:
      throw new Error(`Unknown payment provider type defined: ${type}`);
  }
};

export const loadPaymentProviders = async (
  deps: PaymentProviderDeps
): Promise<PaymentProvider[]> => {
  // Soft-deleted providers are loaded too: a payment taken through one still
  // has webhooks to deliver and an invoice to render.
  const rows = await deps.prisma.settingPaymentProvider.findMany({
    orderBy: { id: 'asc' },
  });

  return rows.map(row => createPaymentProvider(row.id, row.type, deps));
};
