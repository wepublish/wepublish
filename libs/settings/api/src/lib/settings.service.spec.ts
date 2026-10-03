import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaModule } from '@wepublish/nest-modules';
import { PrismaClient, Setting } from '@prisma/client';
import { SettingName } from './setting';
import { GraphQLSettingValueType } from './settings.model';
import { SettingDataloaderService } from './setting-dataloader.service';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, KvTtlCacheModule],
      providers: [
        SettingsService,
        GraphQLSettingValueType,
        {
          provide: SettingDataloaderService,
          useValue: {
            prime: jest.fn(),
          },
        },
      ],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<SettingsService>(SettingsService);
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('should list settings', async () => {
    const mockSettings: Setting[] = [
      {
        id: '1',
        name: SettingName.ALLOW_GUEST_COMMENTING,
        value: true,
        createdAt: new Date('1/1/2020'),
        modifiedAt: new Date('2/1/2020'),
        settingRestriction: null,
      },
      {
        id: '2',
        name: SettingName.COMMENT_CHAR_LIMIT,
        value: 1000,
        createdAt: new Date('1/1/2020'),
        modifiedAt: new Date('2/1/2020'),
        settingRestriction: null,
      },
    ];

    const mockFunction = jest
      .spyOn(prisma.setting, 'findMany')
      .mockResolvedValue(mockSettings);

    const result = await service.settingsList();
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('drops rows the exposed enum cannot represent', async () => {
    const known: Setting = {
      id: '1',
      name: SettingName.ALLOW_GUEST_COMMENTING,
      value: true,
      createdAt: new Date('1/1/2020'),
      modifiedAt: new Date('2/1/2020'),
      settingRestriction: null,
    };

    jest.spyOn(prisma.setting, 'findMany').mockResolvedValue([
      known,
      {
        ...known,
        id: '2',
        name: 'providerRegistryReconciled',
      },
    ]);

    await expect(service.settingsList()).resolves.toEqual([known]);
  });

  test('should fetch a single setting by ID', async () => {
    const mockSetting: Setting = {
      id: '1',
      name: 'setting1',
      value: 'value1',
      createdAt: new Date('1/1/2020'),
      modifiedAt: new Date('2/1/2020'),
      settingRestriction: null,
    };

    const mockFunction = jest
      .spyOn(prisma.setting, 'findUnique')
      .mockResolvedValue(mockSetting);

    const id = '1';
    const result = await service.setting(id);
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should update settings', async () => {
    const updateInput = {
      name: SettingName.ALLOW_COMMENT_EDITING,
      value: false,
    };

    const updatedSetting: Setting = {
      id: '1',
      name: SettingName.ALLOW_COMMENT_EDITING,
      value: false,
      createdAt: new Date('1/1/2020'),
      modifiedAt: new Date('2/1/2020'),
      settingRestriction: {
        allowedValues: {
          boolChoice: true,
        },
      },
    };

    jest.spyOn(prisma.setting, 'findUnique').mockResolvedValue(updatedSetting);
    jest.spyOn(prisma.setting, 'update').mockResolvedValue(updatedSetting);

    const result = await service.updateSetting(updateInput);
    expect(result).toMatchSnapshot({
      modifiedAt: expect.any(Date),
      createdAt: expect.any(Date),
      id: expect.any(String),
    });
  });

  describe('cache', () => {
    const setting: Setting = {
      id: '1',
      name: SettingName.ALLOW_GUEST_COMMENTING,
      value: true,
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      modifiedAt: new Date('2020-02-01T00:00:00.000Z'),
      settingRestriction: null,
    };

    test('serves the settings list from the cache', async () => {
      const findMany = jest
        .spyOn(prisma.setting, 'findMany')
        .mockResolvedValue([setting]);

      await service.settingsList();
      const second = await service.settingsList();

      expect(findMany).toHaveBeenCalledTimes(1);
      expect(second).toEqual([setting]);
    });

    test('serves a setting by name from the cache', async () => {
      const findUnique = jest
        .spyOn(prisma.setting, 'findUnique')
        .mockResolvedValue(setting);

      await service.settingByName(SettingName.ALLOW_GUEST_COMMENTING);
      await service.settingByName(SettingName.ALLOW_GUEST_COMMENTING);

      expect(findUnique).toHaveBeenCalledTimes(1);
    });

    test('loads the settings again after one was updated', async () => {
      const findMany = jest
        .spyOn(prisma.setting, 'findMany')
        .mockResolvedValue([setting]);
      jest.spyOn(prisma.setting, 'findUnique').mockResolvedValue(setting);
      jest.spyOn(prisma.setting, 'update').mockResolvedValue(setting);

      await service.settingsList();
      await service.updateSetting({
        name: SettingName.ALLOW_GUEST_COMMENTING,
        value: false,
      });
      await service.settingsList();

      expect(findMany).toHaveBeenCalledTimes(2);
    });
  });
});
