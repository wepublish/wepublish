import { Test } from '@nestjs/testing';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';
import { AuthorDataloaderService } from './author-dataloader.service';
import { ArticleAuthorDataloader } from './article-author.dataloader';
import { ArticleSocialMediaAuthorDataloader } from './article-social-media-author.dataloader';
import { AuthorLinkDataloader } from './author-links.dataloader';

describe('author content cache', () => {
  let kv: KvTtlCacheService;
  const author = { id: 'author-1', name: 'Anna' };
  const prisma = {
    author: { findMany: jest.fn() },
    articleRevisionAuthor: { findMany: jest.fn() },
    articleRevisionSocialMediaAuthor: { findMany: jest.fn() },
    authorsLinks: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);
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

  it.each<
    [
      string,
      () => { load: (id: string) => Promise<unknown> },
      jest.Mock,
      string,
    ]
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
    await new PublicContentCacheInvalidator(kv).invalidateDraft('authors');
    await new AuthorDataloaderService(prisma as any, kv).load('author-1');

    expect(prisma.author.findMany).toHaveBeenCalledTimes(2);
  });
});
