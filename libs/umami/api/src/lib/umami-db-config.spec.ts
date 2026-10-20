import { AnalyticsProviderType, PrismaClient } from '@prisma/client';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';
import { UmamiDbConfig } from './umami-db-config';

describe('UmamiDbConfig', () => {
  const create = (row: Record<string, unknown> | null) => {
    const settingAnalyticsProvider = {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn(),
      findUnique: vi.fn().mockResolvedValue(row),
    };

    return {
      settingAnalyticsProvider,
      config: new UmamiDbConfig(
        { settingAnalyticsProvider } as unknown as PrismaClient,
        createKvMock(),
        'umami'
      ),
    };
  };

  it('creates the configuration if it does not exist yet', async () => {
    const { config, settingAnalyticsProvider } = create(null);

    await config.initDatabaseConfiguration();

    expect(settingAnalyticsProvider.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          id: 'umami',
          type: AnalyticsProviderType.UMAMI,
          name: 'Umami',
          credentials: null,
        }),
      ],
      skipDuplicates: true,
    });
  });

  it('decrypts the api key and falls back to Umami Cloud', async () => {
    const { config } = create({
      credentials: new SecretCrypto().encrypt('secret-key'),
      property: 'website-id',
      articlePrefix: '/a/',
      url: null,
    });

    await expect(config.getUmami()).resolves.toEqual({
      apiKey: 'secret-key',
      websiteId: 'website-id',
      articlePrefix: '/a/',
      url: 'https://api.umami.is/v1',
    });
  });

  it('uses the configured url of a self hosted instance', async () => {
    const { config } = create({
      credentials: null,
      property: 'website-id',
      articlePrefix: null,
      url: 'https://umami.example.com/api',
    });

    await expect(config.getUmami()).resolves.toMatchObject({
      apiKey: undefined,
      articlePrefix: '/a',
      url: 'https://umami.example.com/api',
    });
  });
});
