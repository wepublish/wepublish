import {
  Prisma,
  PrismaClient,
  WebsiteSettings as PrismaWebsiteSettings,
} from '@prisma/client';
import { WebsiteSettingsService } from './website-settings.service';
import { UpdateWebsiteSettingsInput } from './website-settings.model';

const baseSettings: PrismaWebsiteSettings = {
  id: 'default',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  modifiedAt: new Date('2026-01-01T00:00:00.000Z'),
  analyticsGAEnabled: false,
  analyticsGAId: null,
  analyticsGTMEnabled: false,
  analyticsGTMId: null,
  analyticsPAEnabled: true,
  analyticsPAId: 'plausible.example',
  analyticsPiwikEnabled: false,
  analyticsPiwikId: null,
  adsSparkLoopEnabled: false,
  adsSparkLoopId: null,
  theme: {},
  fonts: [],
};

type WebsiteSettingsDelegateMock = {
  findFirst: jest.Mock<
    Promise<PrismaWebsiteSettings | null>,
    [Prisma.WebsiteSettingsFindFirstArgs?]
  >;
  findFirstOrThrow: jest.Mock<
    Promise<PrismaWebsiteSettings>,
    [Prisma.WebsiteSettingsFindFirstOrThrowArgs?]
  >;
  create: jest.Mock<
    Promise<PrismaWebsiteSettings>,
    [Prisma.WebsiteSettingsCreateArgs]
  >;
  update: jest.Mock<
    Promise<PrismaWebsiteSettings>,
    [Prisma.WebsiteSettingsUpdateArgs]
  >;
};

function createPrismaMock(settings: PrismaWebsiteSettings | null) {
  const delegate: WebsiteSettingsDelegateMock = {
    findFirst: jest.fn().mockResolvedValue(settings),
    findFirstOrThrow: jest.fn().mockResolvedValue(settings ?? baseSettings),
    create: jest.fn().mockResolvedValue(baseSettings),
    update: jest.fn().mockResolvedValue(baseSettings),
  };

  return {
    delegate,
    prisma: {
      websiteSettings: delegate,
    } as unknown as PrismaClient,
  };
}

describe('WebsiteSettingsService', () => {
  it('creates the default website settings row when it is missing', async () => {
    const { delegate, prisma } = createPrismaMock(null);
    const service = new WebsiteSettingsService(prisma);

    const settings = await service.getSettings();

    expect(settings).toEqual(baseSettings);
    expect(delegate.create).toHaveBeenCalledWith({
      data: { id: 'default' },
    });
  });

  it('updates piwik analytics independently from plausible analytics', async () => {
    const { delegate, prisma } = createPrismaMock(baseSettings);
    const service = new WebsiteSettingsService(prisma);

    const input: UpdateWebsiteSettingsInput = {
      analytics: {
        googleAnalytics: { enabled: false, key: undefined },
        googleTagManager: { enabled: false, key: undefined },
        plausible: { enabled: false, key: 'plausible.example' },
        piwik: { enabled: true, key: 'piwik.example' },
      },
    };

    await service.updateSettings(input);

    expect(delegate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          analyticsPAEnabled: false,
          analyticsPiwikEnabled: true,
          analyticsPiwikId: 'piwik.example',
        }),
      })
    );
  });
});
