import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaModule } from '@wepublish/nest-modules';
import { Setting, SettingName } from './setting';
import { SETTINGS_METADATA_KEY } from './settings.decorator';
import { SettingsGuard } from './settings.guard';

const mockTrueSetting: Setting = {
  id: 'Foo',
  name: SettingName.MAKE_ACTIVE_SUBSCRIBERS_API_PUBLIC,
  value: true,
};

const mockFalseSetting: Setting = {
  id: 'bar',
  name: SettingName.MAKE_NEW_SUBSCRIBERS_API_PUBLIC,
  value: false,
};

describe('SettingsGuard', () => {
  let reflector: Reflector;
  let guard: SettingsGuard;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [SettingsGuard],
    }).compile();

    guard = module.get<SettingsGuard>(SettingsGuard);
    reflector = module.get<Reflector>(Reflector);
    prisma = module.get<PrismaClient>(PrismaClient);

    jest.spyOn(prisma.setting, 'findMany').mockImplementation((args): any => {
      const settings =
        ((args?.where?.name as Prisma.StringFilter).in as SettingName[]) ?? [];

      return Promise.resolve(
        settings
          .map(settingName => {
            switch (settingName) {
              case mockTrueSetting.name:
                return mockTrueSetting;
              case mockFalseSetting.name:
                return mockFalseSetting;
            }
          })
          .filter(Boolean)
      );
    });
  });

  it('should return true if no settings are set', async () => {
    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockReturnValue([]);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBeTruthy();
    expect(reflectorSpy).toHaveBeenCalledWith(SETTINGS_METADATA_KEY, [{}, {}]);
  });

  it('should return true if the setting is set to true', async () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockReturnValue([mockTrueSetting.name]);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(SETTINGS_METADATA_KEY, [{}, {}]);
  });

  it('should return true if one of the settings is set to true', async () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockReturnValue([mockFalseSetting.name, mockTrueSetting.name]);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(SETTINGS_METADATA_KEY, [{}, {}]);
  });

  it('should return false if no settings can be found', async () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockReturnValue(['Foobar']);

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(SETTINGS_METADATA_KEY, [{}, {}]);
  });

  it('should return false if the setting is set to false', async () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockReturnValue([mockFalseSetting.name]);

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(SETTINGS_METADATA_KEY, [{}, {}]);
  });
});
