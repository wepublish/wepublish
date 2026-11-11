import { BexioPaymentProvider, PaymentsService } from '@wepublish/payment/api';
import { BexioPrintSourceService } from './bexio-print-source.service';

const bexioProvider = (apiKey: string | null) => {
  const provider = Object.create(BexioPaymentProvider.prototype);
  provider.getConfig = vi.fn(async () => ({ apiKey }));

  return provider as BexioPaymentProvider;
};

const payments = (providers: unknown[]) =>
  ({ getProviders: () => providers }) as unknown as PaymentsService;

describe('BexioPrintSourceService', () => {
  it('has no client without a bexio payment provider', async () => {
    const service = new BexioPrintSourceService(payments([{ id: 'stripe' }]));

    expect(await service.client()).toBeNull();
  });

  it('has no client while the provider has no API key', async () => {
    const service = new BexioPrintSourceService(
      payments([bexioProvider(null)])
    );

    expect(await service.client()).toBeNull();
  });

  it('says whether bexio can be read at all', async () => {
    expect(
      await new BexioPrintSourceService(
        payments([bexioProvider(null)])
      ).configured()
    ).toBe(false);
    expect(
      await new BexioPrintSourceService(
        payments([bexioProvider('secret-key')])
      ).configured()
    ).toBe(true);
  });

  it('reads bexio with the payment provider key', async () => {
    const fetchFn = vi.fn(async () => new Response('[]', { status: 200 }));
    const service = new BexioPrintSourceService(
      payments([{ id: 'stripe' }, bexioProvider('secret-key')])
    );

    const client = await service.client(fetchFn as unknown as typeof fetch);
    await client!.countries();

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.bexio.com/2.0/country',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer secret-key',
        }),
      })
    );
  });
});
