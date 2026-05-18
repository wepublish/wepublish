import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  FrontendTrackingProviderType,
  PrismaClient,
  SettingFrontendTracking,
} from '@prisma/client';
import { PrismaModule } from '@wepublish/nest-modules';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

import { FrontendTrackingSettingsService } from './frontend-tracking-settings.service';

describe('FrontendTrackingSettingsService', () => {
  let service: FrontendTrackingSettingsService;
  let prisma: PrismaClient;

  const baseRow = (
    overrides: Partial<SettingFrontendTracking> = {}
  ): SettingFrontendTracking => ({
    id: 'row-1',
    createdAt: new Date('2026-05-18'),
    modifiedAt: new Date('2026-05-18'),
    lastLoadedAt: new Date('2026-05-18'),
    type: FrontendTrackingProviderType.GOOGLE_ANALYTICS_4,
    name: null,
    active: false,
    ga4_measurementId: null,
    gtm_containerId: null,
    plausible_siteId: null,
    plausible_scriptUrl: null,
    piwik_containerId: null,
    piwik_subdomain: null,
    ...overrides,
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        FrontendTrackingSettingsService,
        {
          provide: KvTtlCacheService,
          useValue: { resetNamespace: jest.fn() },
        },
      ],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<FrontendTrackingSettingsService>(
      FrontendTrackingSettingsService
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('initDatabaseConfiguration creates one row per enum value when none exist', async () => {
    jest
      .spyOn(prisma.settingFrontendTracking, 'findUnique')
      .mockResolvedValue(null);
    const createSpy = jest
      .spyOn(prisma.settingFrontendTracking, 'create')
      .mockResolvedValue(baseRow());

    await service.initDatabaseConfiguration();

    const enumValues = Object.values(FrontendTrackingProviderType);
    expect(createSpy).toHaveBeenCalledTimes(enumValues.length);
    for (const type of enumValues) {
      expect(createSpy).toHaveBeenCalledWith({
        data: { type, active: false },
      });
    }
  });

  test('initDatabaseConfiguration is idempotent (skips existing rows)', async () => {
    jest
      .spyOn(prisma.settingFrontendTracking, 'findUnique')
      .mockResolvedValue(baseRow());
    const createSpy = jest
      .spyOn(prisma.settingFrontendTracking, 'create')
      .mockResolvedValue(baseRow());

    await service.initDatabaseConfiguration();

    expect(createSpy).not.toHaveBeenCalled();
  });

  test('activeFrontendTrackingProviders filters by active=true', async () => {
    const activeRow = baseRow({ active: true });
    const findManySpy = jest
      .spyOn(prisma.settingFrontendTracking, 'findMany')
      .mockResolvedValue([activeRow]);

    const result = await service.activeFrontendTrackingProviders();

    expect(findManySpy).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { type: 'asc' },
    });
    expect(result).toEqual([activeRow]);
  });

  test('updateFrontendTrackingSetting throws when row missing', async () => {
    jest
      .spyOn(prisma.settingFrontendTracking, 'findUnique')
      .mockResolvedValue(null);

    await expect(
      service.updateFrontendTrackingSetting({ id: 'nope' })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test('updateFrontendTrackingSetting drops undefined fields before persisting', async () => {
    jest
      .spyOn(prisma.settingFrontendTracking, 'findUnique')
      .mockResolvedValue(baseRow());
    const updateSpy = jest
      .spyOn(prisma.settingFrontendTracking, 'update')
      .mockResolvedValue(baseRow({ active: true, ga4_measurementId: 'G-1' }));

    await service.updateFrontendTrackingSetting({
      id: 'row-1',
      active: true,
      ga4_measurementId: 'G-1',
      gtm_containerId: undefined,
    });

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      data: { active: true, ga4_measurementId: 'G-1' },
    });
  });
});
