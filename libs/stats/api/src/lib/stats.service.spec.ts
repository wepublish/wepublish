import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { PrismaClient } from '@prisma/client';

describe('StatsService', () => {
  let service: StatsService;
  let prismaMock: {
    author: { [method in keyof PrismaClient['author']]?: jest.Mock };
    article: { [method in keyof PrismaClient['article']]?: jest.Mock };
    articleRevision: {
      [method in keyof PrismaClient['articleRevision']]?: jest.Mock;
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
      author: {
        count: jest.fn(),
      },
      article: {
        count: jest.fn(),
      },
      articleRevision: {
        findFirst: jest.fn(),
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
