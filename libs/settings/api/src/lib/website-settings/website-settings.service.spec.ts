import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';
import { WebsiteSettingsService } from './website-settings.service';

describe('WebsiteSettingsService', () => {
  let service: WebsiteSettingsService;
  let prisma: {
    websiteSettings: {
      findFirst: Mock;
      findFirstOrThrow: Mock;
      update: Mock;
    };
  };

  beforeEach(async () => {
    const settings = { id: 'settings-1', analyticsGAEnabled: false };
    prisma = {
      websiteSettings: {
        findFirst: vi.fn().mockResolvedValue(settings),
        findFirstOrThrow: vi.fn().mockResolvedValue(settings),
        update: vi.fn().mockResolvedValue(settings),
      },
    };

    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
      providers: [
        WebsiteSettingsService,
        { provide: PrismaClient, useValue: prisma },
      ],
    }).compile();

    service = module.get(WebsiteSettingsService);
  });

  it('serves the website settings from the cache', async () => {
    await service.getSettings();
    const second = await service.getSettings();

    expect(prisma.websiteSettings.findFirst).toHaveBeenCalledTimes(1);
    expect(second).toEqual({ id: 'settings-1', analyticsGAEnabled: false });
  });

  it('loads the website settings again after they were updated', async () => {
    await service.getSettings();
    await service.updateSettings({});
    await service.getSettings();

    expect(prisma.websiteSettings.findFirst).toHaveBeenCalledTimes(2);
  });
});
