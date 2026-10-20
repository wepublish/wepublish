import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { createKvMock, KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import type { Mock } from 'vitest';
import {
  PLAUSIBLE_CLIENT_OPTIONS,
  PlausibleConfig,
  PlausibleService,
} from './plausible.service';

describe('PlausibleService', () => {
  let config: PlausibleConfig;
  let service: PlausibleService;
  let fetchMock: Mock;
  let findMany: Mock;

  const response = (...rows: Array<[string, number]>) =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          results: rows.map(([page, visitors]) => ({
            dimensions: [page],
            metrics: [visitors],
          })),
        })
      )
    );

  const failingLookup = () =>
    service.getMostViewedArticles({}).catch(() => undefined);

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2023-01-01T10:00:00'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    config = {
      apiKey: 'secret-key',
      siteId: 'example.com',
      url: 'https://plausible.io',
      articlePrefix: '/a/',
    };
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    findMany = vi.fn().mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlausibleService,
        { provide: PrismaClient, useValue: { article: { findMany } } },
        {
          provide: PLAUSIBLE_CLIENT_OPTIONS,
          useValue: { getPlausible: () => Promise.resolve(config) },
        },
        { provide: KvTtlCacheService, useValue: createKvMock() },
      ],
    }).compile();

    service = module.get(PlausibleService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([['apiKey' as const], ['siteId' as const]])(
    'returns an empty array without contacting Plausible when %s is not set',
    async key => {
      config[key] = undefined;

      await expect(service.getMostViewedArticles({})).resolves.toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('queries the most visited article pages of the site', async () => {
    fetchMock.mockReturnValue(response(['/a/foo', 10]));

    await service.getMostViewedArticles({ start: new Date('2022-12-24') });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://plausible.io/api/v2/query');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer secret-key',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(init.body)).toEqual({
      site_id: 'example.com',
      metrics: ['visitors'],
      date_range: ['2022-12-24', '2023-01-01'],
      dimensions: ['event:page'],
      filters: [['contains', 'event:page', ['/a/']]],
      order_by: [['visitors', 'desc']],
    });
  });

  it('defaults to the last 31 days and supports self hosted instances', async () => {
    config.url = 'https://stats.example.com/';
    fetchMock.mockReturnValue(response());

    await service.getMostViewedArticles({});

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://stats.example.com/api/v2/query');
    expect(JSON.parse(init.body).date_range).toEqual([
      '2022-12-01',
      '2023-01-01',
    ]);
  });

  it('returns the articles sorted by visitors', async () => {
    fetchMock.mockReturnValue(
      response(
        ['/a/foo', 10],
        ['/a/bar', 30],
        ['/a/foo/comments', 99],
        ['/', 500]
      )
    );
    findMany.mockResolvedValue([{ slug: 'foo' }, { slug: 'bar' }]);

    const result = await service.getMostViewedArticles({});

    expect(findMany.mock.calls[0][0].where.slug.in).toEqual(['bar', 'foo']);
    expect(result).toEqual([{ slug: 'bar' }, { slug: 'foo' }]);
  });

  it('caches the result', async () => {
    fetchMock.mockImplementation(() => response(['/a/foo', 10]));

    await service.getMostViewedArticles({});
    await service.getMostViewedArticles({});

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects when Plausible answers with an error, without caching it', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('Invalid API key', { status: 401 })
    );
    fetchMock.mockImplementation(() => response(['/a/foo', 10]));

    await expect(service.getMostViewedArticles({})).rejects.toThrow('401');
    await service.getMostViewedArticles({});

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops contacting Plausible after 3 consecutive failures', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'));

    await failingLookup();
    await failingLookup();
    await failingLookup();

    await expect(service.getMostViewedArticles({})).rejects.toThrow(
      'Circuit breaker is open'
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
