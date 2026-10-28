import { Test, TestingModule } from '@nestjs/testing';
import { NamespacedCache } from '@wepublish/kv-ttl-cache/api';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import {
  PUBLIC_CONTENT_SHARED_NAMESPACES,
  PublicContentCacheInvalidator,
  PublicContentInvalidatorModule,
} from '@wepublish/public-content-cache/api';
import { ArticleTagDataloader } from './article-tag.dataloader';

describe('article tag cache', () => {
  let module: TestingModule;
  let kv: NamespacedCache;
  let invalidator: PublicContentCacheInvalidator;
  const prisma = { taggedArticles: { findMany: vi.fn() } };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot({
          sharedNamespaces: PUBLIC_CONTENT_SHARED_NAMESPACES,
        }),
        PublicContentInvalidatorModule,
      ],
    }).compile();
    await module.init();
    kv = module.get(NamespacedCache);
    invalidator = module.get(PublicContentCacheInvalidator);
    prisma.taggedArticles.findMany
      .mockReset()
      .mockResolvedValue([
        { articleId: 'a1', tag: { id: 'tag-1', tag: 'Politik' } },
      ]);
  });

  afterEach(() => module.close());

  it('loads the tags of an article once across requests', async () => {
    await new ArticleTagDataloader(prisma as any, kv).load('a1');
    const tags = await new ArticleTagDataloader(prisma as any, kv).load('a1');

    expect(tags).toEqual([{ id: 'tag-1', tag: 'Politik' }]);
    expect(prisma.taggedArticles.findMany).toHaveBeenCalledTimes(1);
  });

  it('loads them again once articles changed', async () => {
    await new ArticleTagDataloader(prisma as any, kv).load('a1');
    await invalidator.invalidateDraft('articles');
    await new ArticleTagDataloader(prisma as any, kv).load('a1');

    expect(prisma.taggedArticles.findMany).toHaveBeenCalledTimes(2);
  });
});
