import { Test, TestingModule } from '@nestjs/testing';
import { SettingDataloaderService } from './setting-dataloader.service';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';
import type { Mock } from 'vitest';

vi.mock('dataloader', () => ({
  default: vi.fn(function (this: any) {
    this.prime = vi.fn();
    this.load = vi.fn();
    this.loadMany = vi.fn();
    this.clear = vi.fn();
    this.clearAll = vi.fn();
  }),
}));

describe('SettingDataloaderService', () => {
  let service: SettingDataloaderService;
  let prismaMock: {
    setting: {
      findMany: Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      setting: {
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingDataloaderService,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = await module.resolve<SettingDataloaderService>(
      SettingDataloaderService
    );
  });

  it('should prime', () => {
    // @ts-expect-error Mock so typings incorrectly
    const dataloaderMock = DataLoader.mock.instances[0] as any;
    service.prime('123', {} as any);
    expect(dataloaderMock.prime.mock.calls[0]).toMatchSnapshot();
  });

  describe('load', () => {
    beforeEach(async () => {
      // @ts-expect-error mocked so typing doesn't work
      DataLoader.mockImplementation(function (impl: any, opt: any) {
        return {
          load: (id: string) => impl([id]),
          loadMany: (ids: readonly string[]) => impl(ids),
        };
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SettingDataloaderService,
          {
            provide: PrismaClient,
            useValue: prismaMock,
          },
        ],
      }).compile();

      service = await module.resolve<SettingDataloaderService>(
        SettingDataloaderService
      );
    });

    it('should load one', async () => {
      prismaMock.setting.findMany.mockResolvedValue([]);

      await service.load('123');
      expect(prismaMock.setting.findMany).toHaveBeenCalled();
      expect(prismaMock.setting.findMany.mock.calls[0]).toMatchSnapshot();
    });

    it('should load many', async () => {
      prismaMock.setting.findMany.mockResolvedValue([]);

      await service.loadMany(['123', '321']);
      expect(prismaMock.setting.findMany).toHaveBeenCalled();
      expect(prismaMock.setting.findMany.mock.calls[0]).toMatchSnapshot();
    });
  });
});
