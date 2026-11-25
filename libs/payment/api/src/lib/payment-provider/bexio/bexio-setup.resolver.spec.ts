import { PaymentProviderType, PrismaClient } from '@prisma/client';
import { SecretCrypto } from '@wepublish/settings/api';
import { loadBexioSetupOptions } from './bexio-setup.resolver';

const prismaWith = (row: Record<string, unknown> | null) =>
  ({
    settingPaymentProvider: { findUnique: vi.fn().mockResolvedValue(row) },
  }) as unknown as PrismaClient;

describe('loadBexioSetupOptions', () => {
  const crypto = new SecretCrypto();

  it("asks bexio with the integration's own token", async () => {
    const fetcher = vi.fn().mockReturnValue(async () => []);
    const prisma = prismaWith({
      id: 'bexio',
      type: PaymentProviderType.BEXIO,
      apiKey: crypto.encrypt('bexio-token'),
    });

    await expect(
      loadBexioSetupOptions(prisma, 'bexio', fetcher)
    ).resolves.toMatchObject({ accounts: [], countries: [] });
    expect(fetcher).toHaveBeenCalledWith('bexio-token');
  });

  it('needs the token to be saved first', async () => {
    const prisma = prismaWith({
      id: 'bexio',
      type: PaymentProviderType.BEXIO,
      apiKey: null,
    });

    await expect(
      loadBexioSetupOptions(prisma, 'bexio', vi.fn())
    ).rejects.toThrow(/API token/);
  });

  it('only looks into bexio for a bexio integration', async () => {
    const prisma = prismaWith({
      id: 'stripe',
      type: PaymentProviderType.STRIPE,
      apiKey: crypto.encrypt('sk_test'),
    });

    await expect(
      loadBexioSetupOptions(prisma, 'stripe', vi.fn())
    ).rejects.toThrow(/not a bexio/);
  });
});
