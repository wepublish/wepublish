import { Test } from '@nestjs/testing';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';
import { PageDataloaderService } from './page-dataloader.service';
import { PageRevisionDataloaderService } from './page-revision-dataloader.service';
import { PageService } from './page.service';

jest.mock('@wepublish/block-content/api');

const publishedAt = new Date('2026-01-01T00:00:00.000Z');

describe('page content cache', () => {
  let kv: KvTtlCacheService;
  let prisma: {
    page: { findMany: jest.Mock; findFirst: jest.Mock; count: jest.Mock };
  };

  const pageService = () =>
    Object.assign(
      new PageService(prisma as any, new PublicContentCacheInvalidator(kv), kv),
      { __DATALOADER__PageDataloaderService: { prime: jest.fn() } }
    );

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [KvTtlCacheModule],
    }).compile();
    kv = module.get(KvTtlCacheService);
    prisma = {
      page: {
        findMany: jest.fn().mockResolvedValue([{ id: 'p1', publishedAt }]),
        findFirst: jest.fn().mockResolvedValue({ id: 'p1', slug: 'about' }),
        count: jest.fn().mockResolvedValue(1),
      },
    };
  });

  it('loads a page from the database once across requests', async () => {
    await new PageDataloaderService(prisma as any, kv).load('p1');
    const page = await new PageDataloaderService(prisma as any, kv).load('p1');

    expect(page?.publishedAt).toBeInstanceOf(Date);
    expect(prisma.page.findMany).toHaveBeenCalledTimes(1);
  });

  it('loads it again once pages changed', async () => {
    await new PageDataloaderService(prisma as any, kv).load('p1');
    await new PublicContentCacheInvalidator(kv).invalidateDraft('pages');
    await new PageDataloaderService(prisma as any, kv).load('p1');

    expect(prisma.page.findMany).toHaveBeenCalledTimes(2);
  });

  it('loads the revisions of a page once across requests', async () => {
    prisma.page.findMany.mockResolvedValue([
      {
        id: 'p1',
        PagesRevisionPublished: { pageRevision: { id: 'r1', publishedAt } },
      },
    ]);

    await new PageRevisionDataloaderService(prisma as any, kv).load('p1');
    const revisions = await new PageRevisionDataloaderService(
      prisma as any,
      kv
    ).load('p1');

    expect(revisions.published?.id).toBe('r1');
    expect(prisma.page.findMany).toHaveBeenCalledTimes(1);
  });

  it('loads a page by slug once across requests', async () => {
    await pageService().getPageBySlug('About');
    await pageService().getPageBySlug('about');

    expect(prisma.page.findFirst).toHaveBeenCalledTimes(1);
  });

  it('loads a page list once across requests', async () => {
    const args = { take: 5, filter: { published: true } };

    await pageService().getPages(args);
    await pageService().getPages(args);

    expect(prisma.page.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.page.count).toHaveBeenCalledTimes(1);
  });
});
