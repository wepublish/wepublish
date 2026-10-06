import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';
import { ArticleDataloaderService } from './article-dataloader.service';
import { ArticleRevisionDataloaderService } from './article-revision-dataloader.service';
import { ArticleService } from './article.service';

vi.mock('@wepublish/block-content/api');

const publishedAt = new Date('2026-01-01T00:00:00.000Z');

describe('article content cache', () => {
  let kv: KvTtlCacheService;
  let prisma: {
    $queryRaw: Mock;
    article: {
      findMany: Mock;
      findFirst: Mock;
      findUnique: Mock;
      update: Mock;
      count: Mock;
    };
  };

  const articleService = () =>
    Object.assign(
      new ArticleService(
        prisma as any,
        {} as any,
        new PublicContentCacheInvalidator(kv),
        kv,
        { schedule: vi.fn() } as any
      ),
      { __DATALOADER__ArticleDataloaderService: { prime: vi.fn() } }
    );

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);
    prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      article: {
        findMany: vi.fn().mockResolvedValue([{ id: 'a1', publishedAt }]),
        findFirst: vi.fn().mockResolvedValue({ id: 'a1', slug: 'news' }),
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'a1', slug: 'news', likes: 1 }),
        update: vi
          .fn()
          .mockResolvedValue({ id: 'a1', slug: 'news', likes: 2 }),
        count: vi.fn().mockResolvedValue(1),
      },
    };
  });

  it('loads an article from the database once across requests', async () => {
    await new ArticleDataloaderService(prisma as any, kv).load('a1');
    const article = await new ArticleDataloaderService(prisma as any, kv).load(
      'a1'
    );

    expect(article).toEqual({ id: 'a1', publishedAt });
    expect(article?.publishedAt).toBeInstanceOf(Date);
    expect(prisma.article.findMany).toHaveBeenCalledTimes(1);
  });

  it('loads it again once articles changed', async () => {
    await new ArticleDataloaderService(prisma as any, kv).load('a1');
    await new PublicContentCacheInvalidator(kv).invalidateDraft('articles');
    await new ArticleDataloaderService(prisma as any, kv).load('a1');

    expect(prisma.article.findMany).toHaveBeenCalledTimes(2);
  });

  it('loads the revisions of an article once across requests', async () => {
    prisma.article.findMany.mockResolvedValue([
      {
        id: 'a1',
        ArticleRevisionPublished: {
          articleRevision: { id: 'r1', publishedAt },
        },
      },
    ]);

    await new ArticleRevisionDataloaderService(prisma as any, kv).load('a1');
    const revisions = await new ArticleRevisionDataloaderService(
      prisma as any,
      kv
    ).load('a1');

    expect(revisions.published?.id).toBe('r1');
    expect(revisions.published?.publishedAt).toBeInstanceOf(Date);
    expect(prisma.article.findMany).toHaveBeenCalledTimes(1);
  });

  it('loads an article by slug once across requests', async () => {
    await articleService().getArticleBySlug('News');
    await articleService().getArticleBySlug('news');

    expect(prisma.article.findFirst).toHaveBeenCalledTimes(1);
  });

  it('loads an article list once across requests', async () => {
    const args = { take: 5, filter: { published: true } };

    await articleService().getArticles(args);
    const list = await articleService().getArticles(args);

    expect(list.totalCount).toBe(1);
    expect(prisma.article.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.article.count).toHaveBeenCalledTimes(1);
  });

  it('runs every full-text search against the database', async () => {
    const args = { filter: { body: 'election' } };

    await articleService().getArticles(args);
    await articleService().getArticles({ filter: { body: 'election' } });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  describe('likes', () => {
    beforeEach(() => {
      prisma.article.findMany.mockImplementation(
        async ({ where }: { where: { id: { in: string[] } } }) =>
          where.id.in.map(id => ({ id, slug: id === 'a1' ? 'news' : id }))
      );
    });

    it.each<[string, () => Promise<unknown>]>([
      ['liked', () => articleService().likeArticle('a1')],
      ['disliked', () => articleService().dislikeArticle('a1')],
    ])('reloads only the %s article', async (_, vote) => {
      await new ArticleDataloaderService(prisma as any, kv).loadMany([
        'a1',
        'a2',
      ]);
      await vote();
      await new ArticleDataloaderService(prisma as any, kv).loadMany([
        'a1',
        'a2',
      ]);

      expect(prisma.article.findMany).toHaveBeenCalledTimes(2);
      expect(prisma.article.findMany).toHaveBeenLastCalledWith({
        where: { id: { in: ['a1'] } },
      });
    });

    it('reloads a liked article by its slug', async () => {
      await articleService().getArticleBySlug('news');
      await articleService().likeArticle('a1');
      await articleService().getArticleBySlug('news');

      expect(prisma.article.findFirst).toHaveBeenCalledTimes(2);
    });
  });
});
