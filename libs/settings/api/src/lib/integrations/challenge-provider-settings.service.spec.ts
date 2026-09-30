import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SettingChallengeProvider } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { ChallengeProviderSettingsDataloaderService } from './challenge-provider-settings-dataloader.service';
import { ChallengeProviderSettingsService } from './challenge-provider-settings.service';
import { ProviderSettingsChanged } from './provider-settings-changed';

const existing = {
  id: 'hcaptcha',
  name: 'hCaptcha',
  type: 'HCAPTCHA',
  siteKey: 'site-key',
  secret: 'secret',
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  lastLoadedAt: new Date('2026-01-01'),
} as SettingChallengeProvider;

describe('ChallengeProviderSettingsService', () => {
  let service: ChallengeProviderSettingsService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        ChallengeProviderSettingsService,
        { provide: KvTtlCacheService, useValue: { resetNamespace: jest.fn() } },
        { provide: ProviderSettingsChanged, useValue: { notify: jest.fn() } },
        {
          provide: ChallengeProviderSettingsDataloaderService,
          useValue: { prime: jest.fn() },
        },
      ],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<ChallengeProviderSettingsService>(
      ChallengeProviderSettingsService
    );
  });

  afterEach(() => jest.restoreAllMocks());

  test('lists only the providers that were not retired', async () => {
    const findMany = jest
      .spyOn(prisma.settingChallengeProvider, 'findMany')
      .mockResolvedValue([existing]);

    await service.challengeProviderSettingsList({ type: 'HCAPTCHA' } as never);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { type: 'HCAPTCHA', deletedAt: null } })
    );
  });

  test('ignores retired providers when guarding the last one', async () => {
    jest
      .spyOn(prisma.settingChallengeProvider, 'findUnique')
      .mockResolvedValue(existing);
    const count = jest
      .spyOn(prisma.settingChallengeProvider, 'count')
      .mockResolvedValue(1);

    await expect(
      service.deleteChallengeProviderSetting('hcaptcha')
    ).rejects.toThrow('is the only one configured');
    expect(count).toHaveBeenCalledWith({ where: { deletedAt: null } });
  });
});
