import { Test, TestingModule } from '@nestjs/testing';
import { ArticleDataloaderService } from './article-dataloader.service';
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

describe('ArticleDataloaderService', () => {
  let service: ArticleDataloaderService;
  let prismaMock: {
    article: {
      findMany: Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      article: {
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleDataloaderService,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = await module.resolve<ArticleDataloaderService>(
      ArticleDataloaderService
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
          ArticleDataloaderService,
          {
            provide: PrismaClient,
            useValue: prismaMock,
          },
        ],
      }).compile();

      service = await module.resolve<ArticleDataloaderService>(
        ArticleDataloaderService
      );
    });

    it('should load one', async () => {
      prismaMock.article.findMany.mockResolvedValue([]);

      await service.load('123');
      expect(prismaMock.article.findMany).toHaveBeenCalled();
      expect(prismaMock.article.findMany.mock.calls[0]).toMatchSnapshot();
    });

    it('should load many', async () => {
      prismaMock.article.findMany.mockResolvedValue([]);

      await service.loadMany(['123', '321']);
      expect(prismaMock.article.findMany).toHaveBeenCalled();
      expect(prismaMock.article.findMany.mock.calls[0]).toMatchSnapshot();
    });
  });
});
