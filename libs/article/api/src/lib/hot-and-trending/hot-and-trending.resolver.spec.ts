import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
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
