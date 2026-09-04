import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

import { KnowledgeProviderSettingsDataloaderService } from './knowledge-provider-settings-dataloader.service';
import { KnowledgeProviderSettingsService } from './knowledge-provider-settings.service';
import { SecretCrypto } from './secrets-crypto';

// SecretCrypto derives its key from this variable; the dev server has it in .env.
process.env['APP_SECRET_KEY'] ??= 'vitest-only-secret-key-with-32-chars';

const existing = {
  id: 'zettelkasten',
  type: 'ZETTELKASTEN',
  name: 'Zettelkasten',
  url: null,
  token: null,
  tenant: null,
  enabled: false,
  createdAt: new Date('2026-09-03'),
  modifiedAt: new Date('2026-09-03'),
  lastLoadedAt: new Date('2026-09-03'),
};

describe('KnowledgeProviderSettingsService', () => {
  const setup = async () => {
    const prisma = {
      settingKnowledgeProvider: {
        findUnique: jest.fn().mockResolvedValue(existing),
        update: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ ...existing, ...data })
          ),
      },
    };
    const kv = { resetNamespace: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        KnowledgeProviderSettingsService,
        { provide: PrismaClient, useValue: prisma },
        { provide: KvTtlCacheService, useValue: kv },
        {
          provide: KnowledgeProviderSettingsDataloaderService,
          useValue: { prime: jest.fn() },
        },
      ],
    }).compile();

    return {
      service: module.get(KnowledgeProviderSettingsService),
      prisma,
      kv,
    };
  };

  it('encrypts the token before it is stored and never writes it in clear', async () => {
    const { service, prisma } = await setup();

    await service.updateKnowledgeProviderSetting({
      id: 'zettelkasten',
      token: 'geheim',
    });

    const stored =
      prisma.settingKnowledgeProvider.update.mock.calls[0][0].data.token;
    expect(stored).not.toBe('geheim');
    expect(new SecretCrypto().decrypt(stored)).toBe('geheim');
  });

  it('leaves the stored token alone when the form sends an empty token', async () => {
    const { service, prisma } = await setup();

    await service.updateKnowledgeProviderSetting({
      id: 'zettelkasten',
      token: '',
      url: 'http://x',
    });

    expect(
      prisma.settingKnowledgeProvider.update.mock.calls[0][0].data
    ).toEqual({ url: 'http://x' });
  });

  it('resets the cache namespace after an update', async () => {
    const { service, kv } = await setup();

    await service.updateKnowledgeProviderSetting({
      id: 'zettelkasten',
      enabled: true,
    });

    expect(kv.resetNamespace).toHaveBeenCalledWith(
      'settings:knowledge-provider'
    );
  });
});
