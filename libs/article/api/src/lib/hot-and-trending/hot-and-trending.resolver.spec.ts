import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { GraphqlResponseCacheModule } from '@wepublish/kv-ttl-cache/api';
import {
  HOT_AND_TRENDING_DATA_SOURCE,
  HotAndTrendingResolver,
} from './hot-and-trending.resolver';

const hotAndTrendingQuery = `
  query HotAndTrending {
    hotAndTrending {
      __typename
      id
    }
  }
`;

describe('HotAndTrendingResolver', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
        }),
      ],
      providers: [
        HotAndTrendingResolver,
        {
          provide: HOT_AND_TRENDING_DATA_SOURCE,
          useValue: {
            getMostViewedArticles: () => [
              { id: '123' },
              { id: '123-123' },
              { id: '123-123-123' },
            ],
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('hotAndTrending query', async () => {
    await request(app.getHttpServer())
      .post('')
      .send({
        query: hotAndTrendingQuery,
      })
      .expect(res => {
        expect(res.body.data.hotAndTrending).toMatchSnapshot();
      })
      .expect(200);
  });
});

describe('HotAndTrendingResolver anonymous answers', () => {
  let app: INestApplication;
  let getMostViewedArticles: jest.Mock;

  beforeEach(async () => {
    getMostViewedArticles = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphqlResponseCacheModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
        }),
      ],
      providers: [
        HotAndTrendingResolver,
        {
          provide: HOT_AND_TRENDING_DATA_SOURCE,
          useValue: { getMostViewedArticles },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const askAnonymously = async () =>
    (
      await request(app.getHttpServer())
        .post('')
        .send({ query: hotAndTrendingQuery })
        .expect(200)
    ).body.data.hotAndTrending;

  it('keeps answering an anonymous lookup from the cache', async () => {
    getMostViewedArticles.mockResolvedValue([{ id: '123' }]);

    await askAnonymously();
    await askAnonymously();

    expect(getMostViewedArticles).toHaveBeenCalledTimes(1);
  });

  it('answers a failed lookup with an empty list but does not keep that answer', async () => {
    getMostViewedArticles
      .mockRejectedValueOnce(new Error('GA4 unavailable'))
      .mockResolvedValue([{ id: '123' }]);

    expect(await askAnonymously()).toEqual([]);
    expect(await askAnonymously()).toEqual([
      { __typename: 'Article', id: '123' },
    ]);
  });
});
