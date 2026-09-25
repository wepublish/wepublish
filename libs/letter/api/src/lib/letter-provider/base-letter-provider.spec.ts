import { PrismaClient, SettingLetterProvider } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { FakeLetterProvider } from './fake-letter-provider';

function createProvider(config: SettingLetterProvider | null) {
  const prisma = {
    settingLetterProvider: {
      findUnique: jest.fn().mockResolvedValue(config),
      update: jest.fn().mockResolvedValue(config),
    },
  } as unknown as PrismaClient;

  const kv = {
    getOrLoadNs: jest.fn((_ns, _key, loader: () => Promise<unknown>) =>
      loader()
    ),
  } as unknown as KvTtlCacheService;

  return {
    provider: new FakeLetterProvider({ id: 'fakeLetter', prisma, kv }),
    prisma,
  };
}

describe('BaseLetterProvider.getConfig', () => {
  it('answers null for a provider that was never configured', async () => {
    const { provider, prisma } = createProvider(null);

    await expect(provider.getConfig()).resolves.toBeNull();
    expect(prisma.settingLetterProvider.update).not.toHaveBeenCalled();
  });

  it('marks the settings as loaded when they exist', async () => {
    const config = {
      id: 'fakeLetter',
      name: 'Fake',
      clientSecret: null,
      webhookSigningKey: null,
    } as unknown as SettingLetterProvider;
    const { provider, prisma } = createProvider(config);

    await expect(provider.getConfig()).resolves.toMatchObject({ name: 'Fake' });
    expect(prisma.settingLetterProvider.update).toHaveBeenCalled();
  });

  it('names itself without a settings row', async () => {
    const { provider } = createProvider(null);

    await expect(provider.getName()).resolves.toBe('Fake letter provider');
  });
});
