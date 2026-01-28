import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';
import { NavigationDataloaderService } from './navigation-dataloader.service';

jest.mock('dataloader');

describe('NavigationDataloaderService', () => {
  let service: NavigationDataloaderService;
  let prismaMock: {
    navigation: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      navigation: {
        findMany: jest.fn(),
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
    const dataloaderMock = DataLoader.mock.instances[0] as jest.fn;
    service.prime('123', {} as any);
    expect(dataloaderMock.prime.mock.calls[0]).toMatchSnapshot();
  });

  describe('load', () => {
    beforeEach(async () => {
      // @ts-expect-error mocked so typing doesn't work
      DataLoader.mockImplementation((impl, opt) => {
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
