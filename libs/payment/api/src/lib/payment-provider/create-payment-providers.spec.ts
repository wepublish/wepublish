import { PaymentProviderType, PrismaClient } from '@prisma/client';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { loadPaymentProviders } from './create-payment-providers';

describe('loadPaymentProviders', () => {
  const env = process.env;

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
      kv: createKvMock(),
    });

  afterEach(() => {
    process.env = env;
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
