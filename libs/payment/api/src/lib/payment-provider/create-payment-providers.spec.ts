import { PaymentProviderType, PrismaClient } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { loadPaymentProviders } from './create-payment-providers';

describe('loadPaymentProviders', () => {
  const env = process.env;
  let testing: NamespacedCacheTesting;

  beforeEach(async () => {
    testing = await createNamespacedCacheTesting();
  });

  const load = () =>
    loadPaymentProviders({
      prisma: {
        settingPaymentProvider: {
          findMany: vi.fn().mockResolvedValue([
            { id: 'simulated', type: PaymentProviderType.SIMULATED },
            { id: 'stripe', type: PaymentProviderType.STRIPE },
          ]),
        },
      } as unknown as PrismaClient,
      kv: testing.cache,
      resets: testing.resets,
    });

  afterEach(async () => {
    process.env = env;
    await testing.close();
  });

  it('loads the simulated provider outside of production', async () => {
    process.env = { ...env, APP_ENVIRONMENT: 'review' };

    const providers = await load();

    expect(providers.map(({ id }) => id)).toEqual(['simulated', 'stripe']);
  });

  it('never loads the simulated provider on production', async () => {
    process.env = { ...env, APP_ENVIRONMENT: 'production' };

    const providers = await load();

    expect(providers.map(({ id }) => id)).toEqual(['stripe']);
  });

  it('treats an undeclared environment as production', async () => {
    process.env = { ...env, APP_ENVIRONMENT: undefined };

    const providers = await load();

    expect(providers.map(({ id }) => id)).toEqual(['stripe']);
  });
});
