import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  GA_CLIENT_OPTIONS,
  GoogleAnalyticsConfig,
  GoogleAnalyticsService,
} from './google-analytics.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';

const runReportSpy = jest.fn();

jest.mock('@google-analytics/data', () => ({
  BetaAnalyticsDataClient: jest.fn().mockImplementation(() => ({
    runReport: runReportSpy,
    close: jest.fn(),
  })),
}));

describe('GoogleAnalyticsService', () => {
  let config: GoogleAnalyticsConfig;
  let service: GoogleAnalyticsService;
  let prismaMock: {
    article: { [method in keyof PrismaClient['article']]?: jest.Mock };
  };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    config = {
      credentials: {
        client_email: 'ga@example.iam.gserviceaccount.com',
        private_key: 'private-key',
      },
      articlePrefix: '/a/',
      property: '1234',
    };

    prismaMock = {
      article: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAnalyticsService,
        { provide: PrismaClient, useValue: prismaMock },
        {
          provide: GA_CLIENT_OPTIONS,
          useValue: {
            getGoogleAnalytics: () => Promise.resolve(config),
          },
        },
        { provide: KvTtlCacheService, useValue: createKvMock() },
      ],
    }).compile();

    service = module.get<GoogleAnalyticsService>(GoogleAnalyticsService);
  });

  const failingLookup = () =>
    service.getMostViewedArticles({}).catch(() => undefined);

  const viewMap = (...slugs: string[]) =>
    Promise.resolve([
      {
        rows: slugs.map(slug => ({
          dimensionValues: [{ value: `/a/${slug}` }],
          metricValues: [{ value: '100' }],
        })),
      },
    ]);

  it('should return an empty array when property is not set', async () => {
    config.property = undefined;
    const result = await service.getMostViewedArticles({});

    expect(result).toHaveLength(0);
    expect(runReportSpy).not.toHaveBeenCalled();
  });

  it('should return  an empty array when credentials is not set', async () => {
    config.credentials = undefined;
    const result = await service.getMostViewedArticles({});

    expect(result).toHaveLength(0);
    expect(runReportSpy).not.toHaveBeenCalled();
  });

  it('should return an empty array without contacting Google when the credentials lack client_email or private_key', async () => {
    const { BetaAnalyticsDataClient } = jest.requireMock(
      '@google-analytics/data'
    );
    config.credentials = { type: 'service_account', private_key: 'key' };

    const result = await service.getMostViewedArticles({});

    expect(result).toHaveLength(0);
    expect(BetaAnalyticsDataClient).not.toHaveBeenCalled();
  });

  it('should not crash the api when a replaced client fails to close', async () => {
    const { BetaAnalyticsDataClient } = jest.requireMock(
      '@google-analytics/data'
    );
    BetaAnalyticsDataClient.mockImplementationOnce(() => ({
      runReport: runReportSpy,
      close: jest.fn(() => Promise.reject(new Error('stub never created'))),
    }));
    runReportSpy.mockRejectedValue(new Error('gRPC timeout'));
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);

    await failingLookup();
    config.credentials = {
      client_email: 'other@example.iam.gserviceaccount.com',
      private_key: 'private-key',
    };
    await failingLookup();
    jest.useRealTimers();
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01'));
    process.off('unhandledRejection', unhandled);

    expect(unhandled).not.toHaveBeenCalled();
  });

  it('should reject when runReport throws, so callers can tell a failed lookup from an empty list', async () => {
    runReportSpy.mockRejectedValue(new Error('gRPC timeout'));

    await expect(service.getMostViewedArticles({})).rejects.toThrow(
      'gRPC timeout'
    );
  });

  it('should reject while the circuit breaker is open', async () => {
    runReportSpy.mockRejectedValue(new Error('gRPC timeout'));

    await failingLookup();
    await failingLookup();
    await failingLookup();

    await expect(service.getMostViewedArticles({})).rejects.toThrow(
      'Circuit breaker is open'
    );
  });

  it('should not cache a failed lookup', async () => {
    runReportSpy.mockRejectedValueOnce(new Error('gRPC timeout'));
    runReportSpy.mockReturnValue(viewMap('foobar'));
    prismaMock.article.findMany?.mockReturnValue([{ slug: 'foobar' }]);

    await failingLookup();
    const result = await service.getMostViewedArticles({});

    expect(runReportSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual([{ slug: 'foobar' }]);
  });

  it('should cache the view map per start day, property and article prefix', async () => {
    runReportSpy.mockReturnValue(viewMap('foobar'));
    prismaMock.article.findMany?.mockReturnValue([]);

    await service.getMostViewedArticles({
      start: new Date('2022-12-31T08:00:00'),
    });
    await service.getMostViewedArticles({
      start: new Date('2022-12-31T09:30:00'),
    });
    await service.getMostViewedArticles({
      start: new Date('2022-12-01T08:00:00'),
    });
    await service.getMostViewedArticles({});
    config.property = '5678';
    await service.getMostViewedArticles({});
    config.articlePrefix = '/artikel/';
    await service.getMostViewedArticles({});

    expect(
      runReportSpy.mock.calls.map(([request]) => [
        request.property,
        request.dateRanges[0].startDate,
      ])
    ).toEqual([
      ['properties/1234', '2022-12-31'],
      ['properties/1234', '2022-12-01'],
      ['properties/1234', '2022-12-01'],
      ['properties/5678', '2022-12-01'],
      ['properties/5678', '2022-12-01'],
    ]);
  });

  it('should build a new client when the private key of the same account is rotated', async () => {
    const { BetaAnalyticsDataClient } = jest.requireMock(
      '@google-analytics/data'
    );
    runReportSpy.mockReturnValue(viewMap('foobar'));
    prismaMock.article.findMany?.mockReturnValue([]);

    await service.getMostViewedArticles({ start: new Date('2022-12-30') });
    await service.getMostViewedArticles({ start: new Date('2022-12-29') });

    expect(BetaAnalyticsDataClient).toHaveBeenCalledTimes(1);

    config.credentials = {
      client_email: 'ga@example.iam.gserviceaccount.com',
      private_key: 'rotated-private-key',
    };
    await service.getMostViewedArticles({ start: new Date('2022-12-28') });

    expect(BetaAnalyticsDataClient).toHaveBeenCalledTimes(2);
    expect(BetaAnalyticsDataClient).toHaveBeenLastCalledWith({
      credentials: config.credentials,
    });
    expect(
      Object.values(service)
        .filter(value => typeof value === 'string')
        .join(' ')
    ).not.toContain('private-key');
  });

  it('should open the circuit breaker after 3 consecutive failures', async () => {
    runReportSpy.mockRejectedValue(new Error('gRPC timeout'));

    await failingLookup();
    await failingLookup();
    await failingLookup();

    expect(runReportSpy).toHaveBeenCalledTimes(3);

    // Circuit is now open — should not call runReport
    await failingLookup();
    expect(runReportSpy).toHaveBeenCalledTimes(3);
  });

  it('should reset the circuit breaker after cooldown', async () => {
    runReportSpy.mockRejectedValue(new Error('gRPC timeout'));

    await failingLookup();
    await failingLookup();
    await failingLookup();

    // Advance past the 5-minute cooldown
    jest.setSystemTime(new Date('2023-01-01T00:06:00'));

    runReportSpy.mockReturnValue(Promise.resolve([{ rows: [] }]));
    prismaMock.article.findMany?.mockReturnValue([]);

    const result = await service.getMostViewedArticles({});
    expect(runReportSpy).toHaveBeenCalledTimes(4);
    expect(result).toHaveLength(0);

    // Reset time for other tests
    jest.setSystemTime(new Date('2023-01-01'));
  });

  it('should reset consecutive failures on success', async () => {
    runReportSpy.mockRejectedValueOnce(new Error('gRPC timeout'));
    runReportSpy.mockRejectedValueOnce(new Error('gRPC timeout'));
    runReportSpy.mockReturnValueOnce(Promise.resolve([{ rows: [] }]));
    prismaMock.article.findMany?.mockReturnValue([]);

    await failingLookup();
    await failingLookup();
    await service.getMostViewedArticles({}); // success — resets counter and caches

    expect(runReportSpy).toHaveBeenCalledTimes(3);

    // 4th call uses cache — no new runReport call
    await service.getMostViewedArticles({});
    expect(runReportSpy).toHaveBeenCalledTimes(3);
  });

  it('should cache the GA4 result and not call runReport again', async () => {
    runReportSpy.mockReturnValue(
      Promise.resolve([
        {
          rows: [
            {
              dimensionValues: [{ value: '/a/foobar' }],
              metricValues: [{ value: '100' }],
            },
          ],
        },
      ])
    );
    prismaMock.article.findMany?.mockReturnValue([]);

    await service.getMostViewedArticles({});
    await service.getMostViewedArticles({});
    await service.getMostViewedArticles({});

    expect(runReportSpy).toHaveBeenCalledTimes(1);
  });

  it('should get articles by popularity', async () => {
    runReportSpy.mockReturnValue(
      Promise.resolve([
        {
          rows: [
            {
              dimensionValues: [{ value: '/a/foobar' }],
              metricValues: [{ value: '123' }],
            },
            {
              dimensionValues: [{ value: '/a/barfoo' }],
              metricValues: [{ value: '1234' }],
            },
            {
              dimensionValues: [{ value: '/a/bazfoo' }],
              metricValues: [{ value: '123456' }],
            },
            {
              dimensionValues: [{ value: '/a/foobaz' }],
              metricValues: [{ value: '12345' }],
            },
          ],
        },
      ])
    );
    prismaMock.article.findMany?.mockReturnValue([
      { published: { slug: 'foobar' } },
      { published: { slug: 'barfoo' } },
      { published: { slug: 'bazfoo' } },
      { published: { slug: 'foobaz' } },
    ]);

    const result = await service.getMostViewedArticles({});

    expect(result).toMatchSnapshot();
    expect(prismaMock.article.findMany?.mock.calls[0]).toMatchSnapshot();
  });

  it('should filter pages out', async () => {
    runReportSpy.mockReturnValue(
      Promise.resolve([
        {
          rows: [
            {
              dimensionValues: [{ value: '/a/foobar/bar' }],
              metricValues: [{ value: '123' }],
            },
            {
              dimensionValues: [{ value: '/a/barfoo' }],
              metricValues: [{ value: '1234' }],
            },
            {
              dimensionValues: [{ value: '/a/bazfoo' }],
              metricValues: [{ value: '123456' }],
            },
            {
              dimensionValues: [{ value: '/a/foobaz/foo' }],
              metricValues: [{ value: '12345' }],
            },
          ],
        },
      ])
    );
    prismaMock.article.findMany?.mockReturnValue([]);

    await service.getMostViewedArticles({});
    expect(prismaMock.article.findMany?.mock.calls[0]).toMatchSnapshot();
  });

  it('should have a working pagination', async () => {
    runReportSpy.mockReturnValue(
      Promise.resolve([
        {
          rows: [
            {
              dimensionValues: [{ value: '/a/foobar' }],
              metricValues: [{ value: '123' }],
            },
            {
              dimensionValues: [{ value: '/a/barfoo' }],
              metricValues: [{ value: '1234' }],
            },
            {
              dimensionValues: [{ value: '/a/bazfoo' }],
              metricValues: [{ value: '123456' }],
            },
            {
              dimensionValues: [{ value: '/a/foobaz' }],
              metricValues: [{ value: '12345' }],
            },
          ],
        },
      ])
    );
    prismaMock.article.findMany?.mockReturnValue([]);

    await service.getMostViewedArticles({
      skip: 1,
      take: 2,
    });
    expect(prismaMock.article.findMany?.mock.calls[0]).toMatchSnapshot();
  });
});
