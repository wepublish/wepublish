import { Logger } from '@nestjs/common';
import { PaymentProviderType, PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { isSimulatedPaymentAllowed } from '@wepublish/utils/api';
import bodyParser from 'body-parser';
import { PaymentProvider } from './payment-provider';
import { BexioPaymentProvider } from './bexio/bexio-payment-provider';
import { MolliePaymentProvider } from './mollie-payment-provider';
import { NeverChargePaymentProvider } from './never-charge-payment-provider';
import { PayrexxPaymentProvider } from './payrexx-payment-provider';
import { PayrexxSubscriptionPaymentProvider } from './payrexx-subscription-payment-provider';
import { SimulatedPaymentProvider } from './simulated-payment-provider';
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
    case PaymentProviderType.SIMULATED:
      // The checkout page posts a plain html form.
      return new SimulatedPaymentProvider({
        id,
        incomingRequestHandler: formBody(),
        prisma,
        kv,
      });
    default:
      throw new Error(`Unknown payment provider type defined: ${type}`);
  }
};

export const loadPaymentProviders = async (
  deps: PaymentProviderDeps
): Promise<PaymentProvider[]> => {
  const rows = await deps.prisma.settingPaymentProvider.findMany({
    orderBy: { id: 'asc' },
  });

  // A simulated provider lets anyone "pay" without money moving, so it never
  // runs on production, even if a row got there (dump, seed, direct insert).
  const allowSimulated = isSimulatedPaymentAllowed();

  return rows
    .filter(row => {
      if (row.type !== PaymentProviderType.SIMULATED || allowSimulated) {
        return true;
      }

      new Logger('PaymentProviders').warn(
        `Skipping simulated payment provider "${row.id}": not allowed on production`
      );

      return false;
    })
    .map(row => createPaymentProvider(row.id, row.type, deps));
};
