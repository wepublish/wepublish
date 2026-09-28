import { Test } from '@nestjs/testing';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';
import { ArticleTagDataloader } from './article-tag.dataloader';

describe('article tag cache', () => {
  let kv: KvTtlCacheService;
  const prisma = { taggedArticles: { findMany: vi.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);
    prisma.taggedArticles.findMany
      .mockReset()
      .mockResolvedValue([
        { articleId: 'a1', tag: { id: 'tag-1', tag: 'Politik' } },
      ]);
  });

  it('loads the tags of an article once across requests', async () => {
    await new ArticleTagDataloader(prisma as any, kv).load('a1');
    const tags = await new ArticleTagDataloader(prisma as any, kv).load('a1');

    expect(tags).toEqual([{ id: 'tag-1', tag: 'Politik' }]);
    expect(prisma.taggedArticles.findMany).toHaveBeenCalledTimes(1);
  });

  it('loads them again once articles changed', async () => {
    await new ArticleTagDataloader(prisma as any, kv).load('a1');
    await new PublicContentCacheInvalidator(kv).invalidateDraft('articles');
    await new ArticleTagDataloader(prisma as any, kv).load('a1');

    expect(prisma.taggedArticles.findMany).toHaveBeenCalledTimes(2);
  });
});
