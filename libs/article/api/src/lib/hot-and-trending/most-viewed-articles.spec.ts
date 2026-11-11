import { PrismaClient } from '@prisma/client';
import {
  findMostViewedArticles,
  toArticleViewMap,
} from './most-viewed-articles';

describe('toArticleViewMap', () => {
  it('maps article paths below the prefix to their slug', () => {
    expect(
      toArticleViewMap(
        [
          ['/a/foobar', 12],
          ['/a/barfoo', 3],
        ],
        '/a/'
      )
    ).toEqual({ foobar: 12, barfoo: 3 });
  });

  it('skips paths outside of the prefix, sub pages and rows without views', () => {
    expect(
      toArticleViewMap(
        [
          ['/', 1000],
          ['/about-us', 50],
          ['/a/foobar/comments', 20],
          ['/a/empty', 0],
          ['/a/foobar', 12],
        ],
        '/a/'
      )
    ).toEqual({ foobar: 12 });
  });
});

describe('findMostViewedArticles', () => {
  const prisma = (articles: Array<{ slug: string }>) => {
    const findMany = vi.fn().mockResolvedValue(articles);

    return {
      findMany,
      prisma: { article: { findMany } } as unknown as PrismaClient,
    };
  };

  it('returns nothing without asking the database when nothing was viewed', async () => {
    const { prisma: client, findMany } = prisma([]);

    await expect(findMostViewedArticles(client, {}, {})).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('loads the most viewed published articles of the requested page, sorted by views', async () => {
    const { prisma: client, findMany } = prisma([{ slug: 'b' }, { slug: 'c' }]);

    const result = await findMostViewedArticles(
      client,
      { a: 10, b: 50, c: 30, d: 1 },
      { skip: 1, take: 2 }
    );

    expect(findMany).toHaveBeenCalledWith({
      where: {
        slug: { in: ['c', 'a'], mode: 'insensitive' },
        publishedAt: { not: null },
      },
    });
    expect(result).toEqual([{ slug: 'b' }, { slug: 'c' }]);
  });
});
