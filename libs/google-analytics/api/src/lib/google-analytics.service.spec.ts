import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  GA_CLIENT_OPTIONS,
  GoogleAnalyticsConfig,
  GoogleAnalyticsService,
} from './google-analytics.service';

const runReportSpy = jest.fn();

jest.mock('@google-analytics/data', () => ({
  BetaAnalyticsDataClient: jest.fn().mockImplementation(() => ({
    runReport: runReportSpy,
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
      credentials: {},
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
      ],
    }).compile();

    service = module.get<GoogleAnalyticsService>(GoogleAnalyticsService);
  });

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
