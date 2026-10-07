import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
} from '@wepublish/kv-ttl-cache/api';
import { SettingDataloaderService } from './setting-dataloader.service';
import { SettingName } from './setting';
import { SETTINGS_CACHE_NAMESPACE } from './settings-cache';

describe('SettingDataloaderService', () => {
  const setting = {
    id: '1',
    name: SettingName.ALLOW_GUEST_COMMENTING,
    value: true,
    createdAt: new Date('2020-01-01T00:00:00.000Z'),
    modifiedAt: new Date('2020-02-01T00:00:00.000Z'),
    settingRestriction: null,
  };
  let prisma: { setting: { findMany: Mock } };
  let kv: KvTtlCacheService;

  beforeEach(async () => {
    prisma = { setting: { findMany: vi.fn().mockResolvedValue([setting]) } };
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);
  });

  const newRequest = () =>
    new SettingDataloaderService(prisma as unknown as PrismaClient, kv);

  it('shares loaded settings between requests', async () => {
    await newRequest().load(SettingName.ALLOW_GUEST_COMMENTING);
    const second = await newRequest().load(SettingName.ALLOW_GUEST_COMMENTING);

    expect(prisma.setting.findMany).toHaveBeenCalledTimes(1);
    expect(second).toEqual(setting);
  });

  it('loads settings again after the settings changed', async () => {
    await newRequest().load(SettingName.ALLOW_GUEST_COMMENTING);
    await kv.resetNamespace(SETTINGS_CACHE_NAMESPACE);
    await newRequest().load(SettingName.ALLOW_GUEST_COMMENTING);

    expect(prisma.setting.findMany).toHaveBeenCalledTimes(2);
  });
});
