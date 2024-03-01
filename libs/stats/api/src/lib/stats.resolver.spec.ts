import {Test, TestingModule} from '@nestjs/testing'
import {INestApplication, Module} from '@nestjs/common'
import request from 'supertest'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriverConfig, ApolloDriver} from '@nestjs/apollo'
import {PrismaClient} from '@prisma/client'
import {PrismaModule} from '@wepublish/nest-modules'
import {StatsResolver} from './stats.resolver'
import {StatsService} from './stats.service'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/',
      cache: 'bounded'
    }),
    PrismaModule
  ],
  providers: [StatsResolver, StatsService]
})
export class AppModule {}

const articlesQuery = `
  query articlesCount {
    articlesCount
  }
`

const authorsQuery = `
  query authorsCount {
    authorsCount
  }
`

const firstArticleDateQuery = `
  query firstArticleDate {
    firstArticleDate
  }
`

describe('StatsResolver', () => {
  let app: INestApplication
  let statsServiceMock: {[method in keyof StatsService]?: jest.Mock}

  beforeEach(async () => {
    statsServiceMock = {
      getArticlesCount: jest.fn(),
      getAuthorsCount: jest.fn(),
      getFirstArticleDate: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded'
        })
      ],
      providers: [
        StatsResolver,
        {
          provide: StatsService,
          useValue: statsServiceMock
        },
        {
          provide: PrismaClient,
          useValue: jest.fn()
        }
      ]
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('getArticlesCount query', async () => {
    const mockedValue = 123
    statsServiceMock.getArticlesCount?.mockResolvedValue(mockedValue)

    await request(app.getHttpServer())
      .post('')
      .send({
        query: articlesQuery,
        variables: {}
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.articlesCount).toEqual(mockedValue)
      })
  })

  test('getAuthorsCount query', async () => {
    const mockedValue = 10
    statsServiceMock.getAuthorsCount?.mockResolvedValue(mockedValue)

    await request(app.getHttpServer())
      .post('')
      .send({
        query: authorsQuery,
        variables: {}
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.authorsCount).toEqual(mockedValue)
      })
  })

  test('getFirstArticleDate query', async () => {
    const mockedValue = new Date('2022-05-14T10:45:02.513Z')
    statsServiceMock.getFirstArticleDate?.mockResolvedValue(mockedValue)

    await request(app.getHttpServer())
      .post('')
      .send({
        query: firstArticleDateQuery,
        variables: {}
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.firstArticleDate).toEqual(mockedValue.toISOString())
      })
  })
})
