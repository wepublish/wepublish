import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { PrismaClient } from '@prisma/client';
import type { Mock } from 'vitest';

describe('StatsService', () => {
  let service: StatsService;
  let prismaMock: {
    author: { [method in keyof PrismaClient['author']]?: Mock };
    article: { [method in keyof PrismaClient['article']]?: Mock };
    articleRevision: {
      [method in keyof PrismaClient['articleRevision']]?: Mock;
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
      author: {
        count: vi.fn(),
      },
      article: {
        count: vi.fn(),
      },
      articleRevision: {
        findFirst: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: PrismaClient, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  it('should query for author count', async () => {
    prismaMock.author.count?.mockResolvedValue(10);
    await service.getAuthorsCount();

    expect(prismaMock.author.count?.mock.calls[0]).toMatchSnapshot();
  });

  it('should query for article count', async () => {
    prismaMock.article.count?.mockResolvedValue(123);
    await service.getArticlesCount();

    expect(prismaMock.article.count?.mock.calls[0]).toMatchSnapshot();
  });

  it('should query for articleRevision findFirst', async () => {
    prismaMock.articleRevision.findFirst?.mockResolvedValue({});
    await service.getFirstArticleDate();

    expect(
      prismaMock.articleRevision.findFirst?.mock.calls[0]
    ).toMatchSnapshot();
  });
});
