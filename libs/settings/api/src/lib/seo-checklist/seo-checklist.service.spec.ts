import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { URLAdapter } from '@wepublish/nest-modules';
import { SeoChecklistService } from './seo-checklist.service';
import { SeoCheckId, SeoCheckStatus } from './seo-checklist.model';

const mockPrisma = {
  article: { findFirst: jest.fn() },
  peerProfile: { findFirst: jest.fn() },
  seoChecklistItem: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const responses: Record<string, { status: number; body: string }> = {
  'https://example.com/api/sitemap': {
    status: 200,
    body: '<urlset xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"><url></url></urlset>',
  },
  'https://example.com/api/rss-feed': {
    status: 200,
    body: '<rss version="2.0"></rss>',
  },
  'https://example.com/a/foo': {
    status: 200,
    body: '<link rel="canonical" href="https://example.com/a/foo"><script type="application/ld+json">{"@type":"NewsArticle"}</script>',
  },
};

describe('SeoChecklistService', () => {
  let service: SeoChecklistService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma.seoChecklistItem.findMany.mockResolvedValue([]);

    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (input: string | URL | Request) => {
        const response = responses[input.toString()];

        if (!response) {
          return new Response('', { status: 404 });
        }

        return new Response(response.body, { status: response.status });
      });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeoChecklistService,
        { provide: PrismaClient, useValue: mockPrisma },
        {
          provide: URLAdapter,
          useValue: new URLAdapter('https://example.com'),
        },
      ],
    }).compile();

    service = module.get(SeoChecklistService);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  test('probes the existing sitemap, feed and latest article', async () => {
    mockPrisma.article.findFirst.mockResolvedValue({ id: '1', slug: 'foo' });
    mockPrisma.peerProfile.findFirst.mockResolvedValue({
      name: 'Example',
      logoID: 'logo',
    });

    const checklist = await service.getChecklist();

    expect(fetchSpy.mock.calls.map(([url]) => url).sort()).toEqual([
      'https://example.com/a/foo',
      'https://example.com/api/rss-feed',
      'https://example.com/api/sitemap',
    ]);
    expect(mockPrisma.article.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ hidden: false, peerId: null }),
      })
    );
    expect(
      checklist.checks.every(check => check.status === SeoCheckStatus.Ok)
    ).toBe(true);
    expect(checklist).toMatchObject({
      websiteUrl: 'https://example.com',
      sitemapUrl: 'https://example.com/api/sitemap',
      rssFeedUrl: 'https://example.com/api/rss-feed',
    });
  });

  test('does not probe an article when none is published', async () => {
    mockPrisma.article.findFirst.mockResolvedValue(null);
    mockPrisma.peerProfile.findFirst.mockResolvedValue(null);

    const checklist = await service.getChecklist();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(
      checklist.checks.find(check => check.id === SeoCheckId.ArticleMarkup)
        ?.status
    ).toBe(SeoCheckStatus.Info);
  });

  test('reports network failures instead of throwing', async () => {
    mockPrisma.article.findFirst.mockResolvedValue(null);
    mockPrisma.peerProfile.findFirst.mockResolvedValue(null);
    fetchSpy.mockRejectedValue(new Error('fetch failed'));

    const checklist = await service.getChecklist();

    expect(
      checklist.checks.find(check => check.id === SeoCheckId.Sitemap)
    ).toMatchObject({ status: SeoCheckStatus.Error, detail: 'fetch failed' });
    expect(
      checklist.checks.find(check => check.id === SeoCheckId.Feed)?.status
    ).toBe(SeoCheckStatus.Warning);
  });

  test('returns completed items with the name of who completed them', async () => {
    const modifiedAt = new Date('2026-09-28T10:00:00Z');

    mockPrisma.seoChecklistItem.findMany.mockResolvedValue([
      {
        itemId: 'gsc-verify',
        modifiedAt,
        completedBy: { firstName: 'Ada', name: 'Lovelace' },
      },
      { itemId: 'gsc-sitemap', modifiedAt, completedBy: null },
    ]);

    await expect(service.getCompletedItems()).resolves.toEqual([
      {
        itemId: 'gsc-verify',
        completedAt: modifiedAt,
        completedBy: 'Ada Lovelace',
      },
      {
        itemId: 'gsc-sitemap',
        completedAt: modifiedAt,
        completedBy: undefined,
      },
    ]);
  });

  test('marks an item as completed by the current user', async () => {
    await service.updateItem('gsc-verify', true, 'user-1');

    expect(mockPrisma.seoChecklistItem.upsert).toHaveBeenCalledWith({
      where: { itemId: 'gsc-verify' },
      create: { itemId: 'gsc-verify', completedByUserId: 'user-1' },
      update: { completedByUserId: 'user-1' },
    });
    expect(mockPrisma.seoChecklistItem.findMany).toHaveBeenCalled();
  });

  test('removes an item when it is unchecked', async () => {
    await service.updateItem('gsc-verify', false, 'user-1');

    expect(mockPrisma.seoChecklistItem.deleteMany).toHaveBeenCalledWith({
      where: { itemId: 'gsc-verify' },
    });
    expect(mockPrisma.seoChecklistItem.upsert).not.toHaveBeenCalled();
  });

  test('rejects invalid item ids', async () => {
    await expect(
      service.updateItem('<script>', true, 'user-1')
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockPrisma.seoChecklistItem.upsert).not.toHaveBeenCalled();
  });
});
