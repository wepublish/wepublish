import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { createKvMock, KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import type { Mock } from 'vitest';
import {
  UMAMI_CLIENT_OPTIONS,
  UmamiConfig,
  UmamiService,
} from './umami.service';

describe('UmamiService', () => {
  let config: UmamiConfig;
  let service: UmamiService;
  let fetchMock: Mock;
  let findMany: Mock;

  const response = (...rows: Array<[string, number]>) =>
    Promise.resolve(
      new Response(JSON.stringify(rows.map(([x, y]) => ({ x, y }))))
    );

  const failingLookup = () =>
    service.getMostViewedArticles({}).catch(() => undefined);

  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2023-01-01T10:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    config = {
      apiKey: 'secret-key',
      websiteId: '4f4c5ea1-0000-4000-8000-000000000000',
      url: 'https://api.umami.is/v1',
      articlePrefix: '/a/',
    };
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    findMany = vi.fn().mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UmamiService,
        { provide: PrismaClient, useValue: { article: { findMany } } },
        {
          provide: UMAMI_CLIENT_OPTIONS,
          useValue: { getUmami: () => Promise.resolve(config) },
        },
        { provide: KvTtlCacheService, useValue: createKvMock() },
      ],
    }).compile();

    service = module.get(UmamiService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([['apiKey' as const], ['websiteId' as const]])(
    'returns an empty array without contacting Umami when %s is not set',
    async key => {
      config[key] = undefined;

      await expect(service.getMostViewedArticles({})).resolves.toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('queries the most viewed paths of the website', async () => {
    fetchMock.mockReturnValue(response(['/a/foo', 10]));

    await service.getMostViewedArticles({
      start: new Date('2022-12-24T00:00:00Z'),
    });

    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://api.umami.is/v1/websites/4f4c5ea1-0000-4000-8000-000000000000/metrics'
    );
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      type: 'path',
      startAt: `${new Date('2022-12-24T00:00:00Z').getTime()}`,
      endAt: `${new Date('2023-01-01T10:00:00Z').getTime()}`,
    });
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer secret-key',
      Accept: 'application/json',
    });
  });

  it('defaults to the last 31 days and supports self hosted instances', async () => {
    config.url = 'https://umami.example.com/api/';
    fetchMock.mockReturnValue(response());

    await service.getMostViewedArticles({});

    const parsed = new URL(fetchMock.mock.calls[0][0]);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://umami.example.com/api/websites/4f4c5ea1-0000-4000-8000-000000000000/metrics'
    );
    expect(parsed.searchParams.get('startAt')).toBe(
      `${new Date('2022-12-01T10:00:00Z').getTime()}`
    );
  });

  it('returns the articles sorted by views', async () => {
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

  it('rejects when Umami answers with an error, without caching it', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('Unauthorized', { status: 401 })
    );
    fetchMock.mockImplementation(() => response(['/a/foo', 10]));

    await expect(service.getMostViewedArticles({})).rejects.toThrow('401');
    await service.getMostViewedArticles({});

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops contacting Umami after 3 consecutive failures', async () => {
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
