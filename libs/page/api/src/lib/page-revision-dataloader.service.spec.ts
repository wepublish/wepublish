import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';
import { PageRevisionDataloaderService } from './page-revision-dataloader.service';

jest.mock('dataloader');

describe('PageRevisionDataloaderService', () => {
  let service: PageRevisionDataloaderService;
  let prismaMock: {
    page: {
      findMany: jest.Mock;
    };
  };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    prismaMock = {
      page: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PageRevisionDataloaderService,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = await module.resolve<PageRevisionDataloaderService>(
      PageRevisionDataloaderService
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
          PageRevisionDataloaderService,
          {
            provide: PrismaClient,
            useValue: prismaMock,
          },
        ],
      }).compile();

      service = await module.resolve<PageRevisionDataloaderService>(
        PageRevisionDataloaderService
      );
    });

    it('should load one', async () => {
      prismaMock.page.findMany.mockResolvedValue([]);

      await service.load('123');
      expect(prismaMock.page.findMany).toHaveBeenCalled();
      expect(prismaMock.page.findMany.mock.calls).toMatchSnapshot();
    });

    it('should load many', async () => {
      prismaMock.page.findMany.mockResolvedValue([]);

      await service.loadMany(['123', '321']);
      expect(prismaMock.page.findMany).toHaveBeenCalled();
      expect(prismaMock.page.findMany.mock.calls).toMatchSnapshot();
    });
  });
});
