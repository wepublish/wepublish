import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { URLAdapter } from '@wepublish/nest-modules';
import { SeoChecklistService } from './seo-checklist.service';
import { SeoCheckId, SeoCheckStatus } from './seo-checklist.model';

const mockPrisma = {
  article: { findFirst: jest.fn() },
  peerProfile: { findFirst: jest.fn() },
};

const responses: Record<string, { status: number; body: string } | Error> = {
  'https://example.com/robots.txt': {
    status: 200,
    body: 'User-agent: *\nAllow: /\nSitemap: https://example.com/api/sitemap',
  },
  'https://example.com/api/sitemap': {
    status: 200,
    body: '<urlset xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"><url></url></urlset>',
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

    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (input: string | URL | Request) => {
        const response = responses[input.toString()];

        if (!response) {
          return new Response('', { status: 404 });
        }

        if (response instanceof Error) {
          throw response;
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

  test('probes the existing robots.txt, sitemap and latest article', async () => {
    mockPrisma.article.findFirst.mockResolvedValue({ id: '1', slug: 'foo' });
    mockPrisma.peerProfile.findFirst.mockResolvedValue({
      name: 'Example',
      logoID: 'logo',
    });

    const checklist = await service.getChecklist();

    expect(fetchSpy.mock.calls.map(([url]) => url)).toEqual(
      expect.arrayContaining([
        'https://example.com/robots.txt',
        'https://example.com/api/sitemap',
        'https://example.com/a/foo',
      ])
    );
    expect(mockPrisma.article.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ hidden: false, peerId: null }),
      })
    );
    expect(
      checklist.checks
        .filter(check => check.status !== SeoCheckStatus.Info)
        .every(check => check.status === SeoCheckStatus.Ok)
    ).toBe(true);
  });

  test('does not probe an article when none is published', async () => {
    mockPrisma.article.findFirst.mockResolvedValue(null);
    mockPrisma.peerProfile.findFirst.mockResolvedValue(null);

    const checklist = await service.getChecklist();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(
      checklist.checks.find(check => check.id === SeoCheckId.StructuredData)
        ?.status
    ).toBe(SeoCheckStatus.Info);
    expect(
      checklist.checks.find(
        check => check.id === SeoCheckId.PublicationMetadata
      )?.status
    ).toBe(SeoCheckStatus.Warning);
  });

  test('reports network failures instead of throwing', async () => {
    mockPrisma.article.findFirst.mockResolvedValue(null);
    mockPrisma.peerProfile.findFirst.mockResolvedValue(null);
    fetchSpy.mockRejectedValue(new Error('fetch failed'));

    const checklist = await service.getChecklist();

    expect(
      checklist.checks.find(check => check.id === SeoCheckId.Robots)
    ).toMatchObject({ status: SeoCheckStatus.Error, detail: 'fetch failed' });
    expect(
      checklist.checks.find(check => check.id === SeoCheckId.Sitemap)?.status
    ).toBe(SeoCheckStatus.Error);
  });
});
