import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';
import { PageRevisionDataloaderService } from './page-revision-dataloader.service';
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

describe('PageRevisionDataloaderService', () => {
  let service: PageRevisionDataloaderService;
  let prismaMock: {
    page: {
      findMany: Mock;
    };
  };

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    prismaMock = {
      page: {
        findMany: vi.fn(),
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
