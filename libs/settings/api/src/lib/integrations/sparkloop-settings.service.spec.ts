import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SettingSparkloop } from '@prisma/client';
import { PrismaModule } from '@wepublish/nest-modules';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

import { SparkloopSettingsService } from './sparkloop-settings.service';

describe('SparkloopSettingsService', () => {
  let service: SparkloopSettingsService;
  let prisma: PrismaClient;

  const singleton = (
    overrides: Partial<SettingSparkloop> = {}
  ): SettingSparkloop => ({
    id: 'singleton',
    createdAt: new Date('2026-05-18'),
    modifiedAt: new Date('2026-05-18'),
    lastLoadedAt: new Date('2026-05-18'),
    name: null,
    teamId: null,
    active: false,
    ...overrides,
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        SparkloopSettingsService,
        {
          provide: KvTtlCacheService,
          useValue: { resetNamespace: jest.fn() },
        },
      ],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<SparkloopSettingsService>(SparkloopSettingsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('initDatabaseConfiguration creates the singleton row when missing', async () => {
    jest.spyOn(prisma.settingSparkloop, 'findUnique').mockResolvedValue(null);
    const createSpy = jest
      .spyOn(prisma.settingSparkloop, 'create')
      .mockResolvedValue(singleton());

    await service.initDatabaseConfiguration();

    expect(createSpy).toHaveBeenCalledWith({
      data: { id: 'singleton', active: false },
    });
  });

  test('initDatabaseConfiguration is idempotent when the singleton exists', async () => {
    jest
      .spyOn(prisma.settingSparkloop, 'findUnique')
      .mockResolvedValue(singleton());
    const createSpy = jest
      .spyOn(prisma.settingSparkloop, 'create')
      .mockResolvedValue(singleton());

    await service.initDatabaseConfiguration();

    expect(createSpy).not.toHaveBeenCalled();
  });

  test('activeSparkloopSettings returns null when not active', async () => {
    const findSpy = jest
      .spyOn(prisma.settingSparkloop, 'findFirst')
      .mockResolvedValue(null);

    const result = await service.activeSparkloopSettings();

    expect(findSpy).toHaveBeenCalledWith({
      where: { id: 'singleton', active: true },
    });
    expect(result).toBeNull();
  });

  test('updateSparkloopSettings updates by singleton id and drops undefined fields', async () => {
    const updateSpy = jest
      .spyOn(prisma.settingSparkloop, 'update')
      .mockResolvedValue(singleton({ active: true, teamId: 'team-42' }));

    await service.updateSparkloopSettings({
      active: true,
      teamId: 'team-42',
      name: undefined,
    });

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'singleton' },
      data: { active: true, teamId: 'team-42' },
    });
  });
});
