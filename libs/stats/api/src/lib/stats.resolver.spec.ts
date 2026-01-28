import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '@wepublish/nest-modules';
import { StatsResolver } from './stats.resolver';
import { StatsService } from './stats.service';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/',
      cache: 'bounded',
    }),
    PrismaModule,
  ],
  providers: [StatsResolver, StatsService],
})
export class AppModule {}

const statsQuery = `
  query Stats {
    stats {
      articlesCount
      authorsCount
      firstArticleDate
    }
  }
`;

const statsQueryWithoutFirstArticleDate = `
  query Stats {
    stats {
      articlesCount
      authorsCount
    }
  }
`;

describe('StatsResolver', () => {
  let app: INestApplication;
  let statsServiceMock: { [method in keyof StatsService]?: jest.Mock };

  beforeEach(async () => {
    statsServiceMock = {
      getArticlesCount: jest.fn(),
      getAuthorsCount: jest.fn(),
      getFirstArticleDate: jest.fn(),
    };

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
        StatsResolver,
        {
          provide: StatsService,
          useValue: statsServiceMock,
        },
        {
          provide: PrismaClient,
          useValue: jest.fn(),
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('stats query', async () => {
    const mockedArticlesValue = 123;
    const mockedAuthorsValue = 10;
    const mockedFirstArticleDateValue = new Date('2022-05-14T10:45:02.513Z');

    statsServiceMock.getArticlesCount?.mockResolvedValue(mockedArticlesValue);
    statsServiceMock.getAuthorsCount?.mockResolvedValue(mockedAuthorsValue);
    statsServiceMock.getFirstArticleDate?.mockResolvedValue(
      mockedFirstArticleDateValue
    );

    await request(app.getHttpServer())
      .post('')
      .send({
        query: statsQuery,
        variables: {},
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.stats).toEqual({
          articlesCount: mockedArticlesValue,
          authorsCount: mockedAuthorsValue,
          firstArticleDate: mockedFirstArticleDateValue.toISOString(),
        });
      });
  });

  test('stats query without first article date', async () => {
    const mockedArticlesValue = 123;
    const mockedAuthorsValue = 10;

    statsServiceMock.getArticlesCount?.mockResolvedValue(mockedArticlesValue);
    statsServiceMock.getAuthorsCount?.mockResolvedValue(mockedAuthorsValue);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: statsQuery,
        variables: {},
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.stats).toEqual({
          articlesCount: mockedArticlesValue,
          authorsCount: mockedAuthorsValue,
          firstArticleDate: null,
        });
      });
  });
});
