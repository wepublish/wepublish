import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';
import { NavigationDataloaderService } from './navigation-dataloader.service';
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

describe('NavigationDataloaderService', () => {
  let service: NavigationDataloaderService;
  let prismaMock: {
    navigation: {
      findMany: Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      navigation: {
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NavigationDataloaderService,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = await module.resolve<NavigationDataloaderService>(
      NavigationDataloaderService
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
          NavigationDataloaderService,
          {
            provide: PrismaClient,
            useValue: prismaMock,
          },
        ],
      }).compile();

      service = await module.resolve<NavigationDataloaderService>(
        NavigationDataloaderService
      );
    });

    it('should load one', async () => {
      prismaMock.navigation.findMany.mockResolvedValue([]);

      await service.load('123');
      expect(prismaMock.navigation.findMany).toHaveBeenCalled();
      expect(prismaMock.navigation.findMany.mock.calls[0]).toMatchSnapshot();
    });

    it('should load many', async () => {
      prismaMock.navigation.findMany.mockResolvedValue([]);

      await service.loadMany(['123', '321']);
      expect(prismaMock.navigation.findMany).toHaveBeenCalled();
      expect(prismaMock.navigation.findMany.mock.calls[0]).toMatchSnapshot();
    });
  });
});
