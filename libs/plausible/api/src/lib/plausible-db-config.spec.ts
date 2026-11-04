import { AnalyticsProviderType, PrismaClient } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { SecretCrypto } from '@wepublish/settings/api';
import { PlausibleDbConfig } from './plausible-db-config';

describe('PlausibleDbConfig', () => {
  let testing: NamespacedCacheTesting | undefined;

  afterEach(async () => {
    await testing?.close();
    testing = undefined;
  });

  const create = async (row: Record<string, unknown> | null) => {
    testing = await createNamespacedCacheTesting();
    const settingAnalyticsProvider = {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn(),
      findUnique: vi.fn().mockResolvedValue(row),
    };

    return {
      settingAnalyticsProvider,
      config: new PlausibleDbConfig(
        { settingAnalyticsProvider } as unknown as PrismaClient,
        testing.cache,
        'plausible'
      ),
    };
  };

  it('creates the configuration if it does not exist yet', async () => {
    const { config, settingAnalyticsProvider } = await create(null);

    await config.initDatabaseConfiguration();

    expect(settingAnalyticsProvider.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          id: 'plausible',
          type: AnalyticsProviderType.PLAUSIBLE,
          name: 'Plausible',
          credentials: null,
        }),
      ],
      skipDuplicates: true,
    });
  });

  it('decrypts the api key and falls back to Plausible Cloud', async () => {
    const { config } = await create({
      credentials: new SecretCrypto().encrypt('secret-key'),
      property: 'example.com',
      articlePrefix: '/a/',
      url: null,
    });

    await expect(config.getPlausible()).resolves.toEqual({
      apiKey: 'secret-key',
      siteId: 'example.com',
      articlePrefix: '/a/',
      url: 'https://plausible.io',
    });
  });

  it('uses the configured url of a self hosted instance', async () => {
    const { config } = await create({
      credentials: null,
      property: 'example.com',
      articlePrefix: null,
      url: 'https://stats.example.com',
    });

    await expect(config.getPlausible()).resolves.toMatchObject({
      apiKey: undefined,
      articlePrefix: '/a',
      url: 'https://stats.example.com',
    });
  });
});
