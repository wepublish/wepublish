import { PrismaClient } from '@prisma/client';
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
      update: vi.fn(async () => {
        if (!row) {
          throw Object.assign(new Error('Record to update not found.'), {
            code: 'P2025',
          });
        }
      }),
      updateMany: vi.fn().mockResolvedValue({ count: row ? 1 : 0 }),
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

  it('works without a stored configuration', async () => {
    const { config } = await create(null);

    await expect(config.getPlausible()).resolves.toMatchObject({
      apiKey: undefined,
      articlePrefix: '/a',
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
