import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';
import { WebsiteSettingsService } from './website-settings.service';

describe('WebsiteSettingsService', () => {
  let service: WebsiteSettingsService;
  let prisma: {
    websiteSettings: {
      findFirst: jest.Mock;
      findFirstOrThrow: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    const settings = { id: 'settings-1', analyticsGAEnabled: false };
    prisma = {
      websiteSettings: {
        findFirst: jest.fn().mockResolvedValue(settings),
        findFirstOrThrow: jest.fn().mockResolvedValue(settings),
        update: jest.fn().mockResolvedValue(settings),
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
