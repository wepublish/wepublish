import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SettingAnalyticsProvider } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { AnalyticsProviderSettingsDataloaderService } from './analytics-provider-settings-dataloader.service';
import { AnalyticsProviderSettingsService } from './analytics-provider-settings.service';
import { SecretCrypto } from './secrets-crypto';

const existing = {
  id: 'plausible',
  name: 'Plausible',
  type: 'PLAUSIBLE',
  hotAndTrending: false,
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  lastLoadedAt: new Date('2026-01-01'),
} as unknown as SettingAnalyticsProvider;

describe('AnalyticsProviderSettingsService', () => {
  let service: AnalyticsProviderSettingsService;
  let prisma: PrismaClient;
  let kv: { resetNamespace: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    kv = { resetNamespace: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        AnalyticsProviderSettingsService,
        { provide: KvTtlCacheService, useValue: kv },
        {
          provide: AnalyticsProviderSettingsDataloaderService,
          useValue: { prime: vi.fn() },
        },
      ],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<AnalyticsProviderSettingsService>(
      AnalyticsProviderSettingsService
    );

    vi.spyOn(prisma.settingAnalyticsProvider, 'findUnique').mockResolvedValue(
      existing
    );
    vi.spyOn(prisma, '$transaction').mockImplementation(((
      transaction: (client: PrismaClient) => Promise<unknown>
    ) => transaction(prisma)) as never);
  });

  afterEach(() => vi.restoreAllMocks());

  test('stores the api key encrypted', async () => {
    const update = vi
      .spyOn(prisma.settingAnalyticsProvider, 'update')
      .mockResolvedValue(existing);

    await service.updateAnalyticsProviderSetting({
      id: 'plausible',
      apiKey: 'secret-key',
    });

    const { credentials } = update.mock.calls[0][0].data as {
      credentials: string;
    };
    expect(credentials).not.toContain('secret-key');
    expect(new SecretCrypto().decrypt(credentials)).toBe('secret-key');
    expect(kv.resetNamespace).toHaveBeenCalledWith(
      'settings:analyticsprovider'
    );
  });

  test('only one provider powers Hot & Trending', async () => {
    const updateMany = vi
      .spyOn(prisma.settingAnalyticsProvider, 'updateMany')
      .mockResolvedValue({ count: 1 });
    const update = vi
      .spyOn(prisma.settingAnalyticsProvider, 'update')
      .mockResolvedValue({ ...existing, hotAndTrending: true });

    await service.updateAnalyticsProviderSetting({
      id: 'plausible',
      hotAndTrending: true,
    });

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: { not: 'plausible' }, hotAndTrending: true },
      data: { hotAndTrending: false },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'plausible' },
      data: { hotAndTrending: true },
    });
  });

  test('leaves the other providers alone when Hot & Trending is not chosen', async () => {
    const updateMany = vi.spyOn(prisma.settingAnalyticsProvider, 'updateMany');
    vi.spyOn(prisma.settingAnalyticsProvider, 'update').mockResolvedValue(
      existing
    );

    await service.updateAnalyticsProviderSetting({
      id: 'plausible',
      hotAndTrending: false,
    });

    expect(updateMany).not.toHaveBeenCalled();
  });
});
