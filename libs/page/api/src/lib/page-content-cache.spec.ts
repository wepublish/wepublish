import type { Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NamespacedCache } from '@wepublish/kv-ttl-cache/api';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import {
  PUBLIC_CONTENT_SHARED_NAMESPACES,
  PublicContentCacheInvalidator,
  PublicContentInvalidatorModule,
} from '@wepublish/public-content-cache/api';
import { PageDataloaderService } from './page-dataloader.service';
import { PageRevisionDataloaderService } from './page-revision-dataloader.service';
import { PageService } from './page.service';

vi.mock('@wepublish/block-content/api');

const publishedAt = new Date('2026-01-01T00:00:00.000Z');

describe('page content cache', () => {
  let module: TestingModule;
  let kv: NamespacedCache;
  let invalidator: PublicContentCacheInvalidator;
  let prisma: {
    page: { findMany: Mock; findFirst: Mock; count: Mock };
  };

  const pageService = () =>
    Object.assign(new PageService(prisma as any, invalidator, kv), {
      __DATALOADER__PageDataloaderService: { prime: vi.fn() },
    });

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
    prisma = {
      page: {
        findMany: vi.fn().mockResolvedValue([{ id: 'p1', publishedAt }]),
        findFirst: vi.fn().mockResolvedValue({ id: 'p1', slug: 'about' }),
        count: vi.fn().mockResolvedValue(1),
      },
    };
  });

  afterEach(() => module.close());

  it('loads a page from the database once across requests', async () => {
    await new PageDataloaderService(prisma as any, kv).load('p1');
    const page = await new PageDataloaderService(prisma as any, kv).load('p1');

    expect(page?.publishedAt).toBeInstanceOf(Date);
    expect(prisma.page.findMany).toHaveBeenCalledTimes(1);
  });

  it('loads it again once pages changed', async () => {
    await new PageDataloaderService(prisma as any, kv).load('p1');
    await invalidator.invalidateDraft('pages');
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
