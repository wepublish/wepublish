import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';
import { ArticleRevisionDataloaderService } from './article-revision-dataloader.service';
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

describe('ArticleRevisionDataloaderService', () => {
  let service: ArticleRevisionDataloaderService;
  let prismaMock: {
    article: {
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
      article: {
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
      providers: [
        ArticleRevisionDataloaderService,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = await module.resolve<ArticleRevisionDataloaderService>(
      ArticleRevisionDataloaderService
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
        imports: [KvTtlCacheModule],
        providers: [
          ArticleRevisionDataloaderService,
          {
            provide: PrismaClient,
            useValue: prismaMock,
          },
        ],
      }).compile();

      service = await module.resolve<ArticleRevisionDataloaderService>(
        ArticleRevisionDataloaderService
      );
    });

    it('should load one', async () => {
      prismaMock.article.findMany.mockResolvedValue([]);

      await service.load('123');
      expect(prismaMock.article.findMany).toHaveBeenCalled();
      expect(prismaMock.article.findMany.mock.calls).toMatchSnapshot();
    });

    it('should load many', async () => {
      prismaMock.article.findMany.mockResolvedValue([]);

      await service.loadMany(['123', '321']);
      expect(prismaMock.article.findMany).toHaveBeenCalled();
      expect(prismaMock.article.findMany.mock.calls).toMatchSnapshot();
    });
  });
});
