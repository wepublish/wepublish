import type { Mock } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { NamespacedCache } from '@wepublish/kv-ttl-cache/api';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import {
  PUBLIC_CONTENT_SHARED_NAMESPACES,
  PublicContentCacheInvalidator,
  PublicContentInvalidatorModule,
} from '@wepublish/public-content-cache/api';
import { AuthorDataloaderService } from './author-dataloader.service';
import { ArticleAuthorDataloader } from './article-author.dataloader';
import { ArticleSocialMediaAuthorDataloader } from './article-social-media-author.dataloader';
import { AuthorLinkDataloader } from './author-links.dataloader';

describe('author content cache', () => {
  let module: TestingModule;
  let kv: NamespacedCache;
  let invalidator: PublicContentCacheInvalidator;
  const author = { id: 'author-1', name: 'Anna' };
  const prisma = {
    author: { findMany: vi.fn() },
    articleRevisionAuthor: { findMany: vi.fn() },
    articleRevisionSocialMediaAuthor: { findMany: vi.fn() },
    authorsLinks: { findMany: vi.fn() },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot({
          sharedNamespaces: PUBLIC_CONTENT_SHARED_NAMESPACES,
        }),
        PublicContentInvalidatorModule,
      ],
    }).compile();
    kv = module.get(NamespacedCache);
    invalidator = module.get(PublicContentCacheInvalidator);
    prisma.author.findMany.mockReset().mockResolvedValue([author]);
    prisma.articleRevisionAuthor.findMany
      .mockReset()
      .mockResolvedValue([{ revisionId: 'r1', authorId: 'author-1', author }]);
    prisma.articleRevisionSocialMediaAuthor.findMany
      .mockReset()
      .mockResolvedValue([{ revisionId: 'r1', author }]);
    prisma.authorsLinks.findMany
      .mockReset()
      .mockResolvedValue([{ authorId: 'author-1', url: 'https://x.ch' }]);
  });

  afterEach(() => module.close());

  it.each<
    [string, () => { load: (id: string) => Promise<unknown> }, Mock, string]
  >([
    [
      'authors',
      () => new AuthorDataloaderService(prisma as any, kv),
      prisma.author.findMany,
      'author-1',
    ],
    [
      'revision authors',
      () => new ArticleAuthorDataloader(prisma as any, kv),
      prisma.articleRevisionAuthor.findMany,
      'r1',
    ],
    [
      'social media authors',
      () => new ArticleSocialMediaAuthorDataloader(prisma as any, kv),
      prisma.articleRevisionSocialMediaAuthor.findMany,
      'r1',
    ],
    [
      'author links',
      () => new AuthorLinkDataloader(prisma as any, kv),
      prisma.authorsLinks.findMany,
      'author-1',
    ],
  ])(
    'loads %s from the database once across requests',
    async (_, loader, query, id) => {
      const first = await loader().load(id);
      const second = await loader().load(id);

      expect(second).toEqual(first);
      expect(query).toHaveBeenCalledTimes(1);
    }
  );

  it('loads authors again once they changed', async () => {
    await new AuthorDataloaderService(prisma as any, kv).load('author-1');
    await invalidator.invalidateDraft('authors');
    await new AuthorDataloaderService(prisma as any, kv).load('author-1');

    expect(prisma.author.findMany).toHaveBeenCalledTimes(2);
  });
});
